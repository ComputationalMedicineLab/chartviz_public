"""
Miscellaneous operations
"""
from datetime import date
from functools import wraps
from itertools import groupby
from operator import itemgetter

import pandas as pd
import numpy as np
import fast_intensity
from django.db.models import F

from taxonomies.models import Chapter, Phecode


# Dategrid constants and data
grid = pd.date_range(date(2000, 1, 1), date.today(), periods=100)
start, end = grid.min(), grid.max()
grid_range = (start, end)


def add_dategrid(func):
    """Wraps a function returning a dict to add the grid to the output"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        rdict = func(*args, **kwargs)
        rdict['dategrid'] = grid
        return rdict
    return wrapper


def infer_intensity(dates, grid=grid):
    """Given a set of (unique) dates, returns an intensity array"""
    offset = grid.min()
    evts = pd.to_datetime(sorted(dates))
    fi = fast_intensity.infer_intensity(
        (evts - offset).days.values.astype(float),
        (grid - offset).days.values.astype(float)
    )
    return fi


def rollup_meds(raw):
    """Take a flat qset of medications and group by sig"""
    meds = []
    keys = ('name', 'strength', 'route', 'frequency',
            'description', 'strength_num')
    raw = raw.order_by(*keys).values().distinct()
    for sig, evts in groupby(raw, key=itemgetter(*keys)):
        datum = dict(zip(keys, sig))
        datum['events'] = sorted(d['date'] for d in evts)
        meds.append(datum)
    return meds


# Lab Category data
# XXX: Blood chemistries and complete blood counts are treated differently than
# other labs by the frontend, being displayed in some views regardless of
# whether or not the patient has the associated lab data. Here we created a
# list of each of these permament labs, which is then populated by rollup_labs
# below. Each item is a dict with keys 'events': [], 'code': str, and
# 'description': str

# Blood Chemistries
CHEM = [
    # Example item:
    # {'events': [], 'code': 'Na', 'description': 'SODIUM BLOOD'},
]
CBC = []
CHEM_CODES = {x['code'] for x in CHEM}
CBC_CODES = {x['code'] for x in CBC}

def rollup_labs(raw):
    """Take a flat qset of lab results and group by kind and code"""
    # Fields that should be same for all instances of a lab
    lab_keys = ('code__code', 'code__description')
    # Percentiles calculated across the whole lab instance set per lab
    perc_keys = ('perc_10', 'perc_25', 'perc_50', 'perc_75', 'perc_90')
    # Keys that only apply to a given instance
    inst_keys = ('datetime', 'value', 'unit', 'normal_min', 'normal_max')
    raw = (raw.values(*lab_keys, *perc_keys, *inst_keys)
           .order_by(*lab_keys, *perc_keys, 'datetime')
           .distinct())
    lab_groups = groupby(raw, key=itemgetter(*lab_keys, *perc_keys))

    _chem = {}
    _cbc = {}
    other = []

    for (code, description, *perc_vals), evts in lab_groups:
        lab = {'code': code, 'description': description, 'events': []}
        lab.update(zip(perc_keys, perc_vals))
        for event in evts:
            lab['events'].append({
                key: (None if val in (float('inf'), -float('inf')) else val)
                for key, val in event.items()
                if key in inst_keys
            })
        if code in CHEM_CODES:
            _chem[code] = lab
        elif code in CBC_CODES:
            _cbc[code] = lab
        else:
            other.append(lab)

    # Sort the chem and abridged CBC labs and fill in missing entries
    chem = [_chem.get(x['code'], x) for x in CHEM]
    cbc = [_cbc.get(x['code'], x) for x in CBC]

    return {
        'chem': chem,
        'cbc': cbc,
        'other': other,
    }


def problem_list(patient):
    """
    For each phecode represented in the patient's ICD instance history,
    calculate an intensity curve and the area under that curve.  Then return
    the top quartile of phecodes sorted by AUC.
    """
    evts = (patient.icdinstance_set
            .filter(code__phecode__isnull=False)
            .annotate(phecode=F('code__phecode'),
                      icd_code=F('code__code'),
                      icd_desc=F('code__description'))
            .values('phecode', 'date', 'icd_code', 'icd_desc')
            .order_by('phecode', 'icd_code', 'icd_desc', 'date')
            .distinct())
    raw = (Phecode.objects
           .filter(pk__in=evts.values('phecode'))
           .values())
    phecodes = []
    # For each Phecode, generate the group of constituent ICD codes, then
    # generate the date range and intensity in that date range for the code
    for _id, events in groupby(evts, key=itemgetter('phecode')):
        event_dates = set()
        data = raw.get(pk=_id)
        data['icds'] = []
        byICD = itemgetter('icd_code', 'icd_desc')
        for (code, description), icd_events in groupby(events, key=byICD):
            dates = {e['date'] for e in icd_events}
            event_dates |= dates
            datum = {'code': code,
                     'description': description,
                     'events': sorted(dates)}
            data['icds'].append(datum)
        first, last = min(event_dates), max(event_dates)
        intensity = infer_intensity(event_dates)
        data['intensity'] = intensity
        data['final_intensity'] = intensity[-1]
        data['auc'] = np.trapz(intensity)
        data['date_range'] = (first, last)
        data['date_spread'] = (last - first).days
        phecodes.append(data)

    # Alternate implementation: sort by AUC and return quartile
    # auc_75 = np.quantile(sorted((d['auc'] for d in phecodes)), 0.75)
    # phecodes = sorted((ph for ph in phecodes if ph['auc'] > auc_75),
    #                   key=itemgetter('auc'),
    #                   reverse=True)

    cutoff = 0.0018
    phecodes = sorted((ph for ph in phecodes
                       if ph['final_intensity'] > cutoff),
                      key=itemgetter('final_intensity'),
                      reverse=True)
    return phecodes
