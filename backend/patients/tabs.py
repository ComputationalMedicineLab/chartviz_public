"""
Functions of a patient
"""
from collections import defaultdict
from datetime import timedelta
from itertools import groupby
from operator import itemgetter

from django.db.models import F

from taxonomies.embedding import most_similar, disjoin_word
from taxonomies.models import Chapter, Phecode
from .util import (add_dategrid, grid_range, infer_intensity, problem_list,
                   rollup_meds, rollup_labs, CHEM_CODES)
from .models import HeartRate, BMI, BloodPressure


@add_dategrid
def overview(patient):
    one_week = timedelta(days=7)
    phecodes = problem_list(patient)

    # Medications
    latest_med = patient.meds.latest('date').date
    med_range = (latest_med - one_week, latest_med)
    med_raw = patient.meds.filter(date__range=med_range)
    meds = rollup_meds(med_raw)

    # Labs
    latest_lab = patient.labinstance_set.latest('datetime').datetime.date()
    lab_range = (latest_lab - one_week, latest_lab)
    lab_codes = (patient.labinstance_set
                 .filter(datetime__date__range=lab_range)
                 .values_list('code', flat=True))
    lab_insts = patient.labinstance_set.filter(code__in=lab_codes)
    labs = rollup_labs(lab_insts)

    # Get the latest vitals
    # If we have no measurements for a given metric, an empty object will
    # return None for all its attributes, so setting bmi = BMI() is a kind of
    # shorthand for saying weight = bmi.weight if bmi else None when we build
    # the vitals dict below
    try:
        bmi = patient.vitals_bmi.latest('weight_date')
    except BMI.DoesNotExist:
        bmi = BMI()
    try:
        pulse = patient.vitals_hr.filter(name='Pulse').latest('entry_date')
    except HeartRate.DoesNotExist:
        pulse = HeartRate()
    try:
        resp = patient.vitals_hr.filter(name='RespRt').latest('entry_date')
    except HeartRate.DoesNotExist:
        resp = HeartRate()
    try:
        bp = patient.vitals_bp.latest('entry_date')
    except BloodPressure.DoesNotExist:
        bp = BloodPressure()

    return {
        'phecodes': phecodes,
        'labs': labs,
        'lab_range': lab_range,
        'meds': meds,
        'med_range': med_range,
        'vitals': {
            'weight': bmi.weight,
            'weight_date': bmi.weight_date,
            'height': bmi.height,
            'height_date': bmi.height_date,
            'bmi': bmi.bmi,
            'pulse': pulse.value,
            'pulse_date': pulse.entry_date,
            'resp': resp.value,
            'resp_date': resp.entry_date,
            'blood_pressure': bp.value,
            'bp_date': bp.entry_date,
            'bp_status': bp.status,
        }
    }


@add_dategrid
def systems(patient):
    """Generate phecode lists and intensity per chapter for the patient"""
    chapters = (Chapter.objects
                .exclude(description='Procedures')
                .values())
    chapter_by_id = {}
    # initialize each chapter so that they all have the same keys even if there
    # are no relevant records for the given patient in a given chapter
    for ch in chapters:
        ch.update({'phecodes': [], 'intensity': []})
        chapter_by_id[ch['id']] = ch

    # dereference ICD's by phecode n chapter since we're rolling up by them
    events = (patient.icdinstance_set
              .filter(code__chapter__isnull=False,
                      code__phecode__isnull=False,
                      date__range=grid_range)
              .annotate(phe_code=F('code__phecode__code'),
                        phe_desc=F('code__phecode__description'),
                        phe_id=F('code__phecode_id'),
                        icd_code=F('code__code'),
                        icd_desc=F('code__description'),
                        chapter_id=F('code__chapter'))
              .values()
              .order_by('chapter_id', 'phe_code', 'icd_code', 'date')
              .distinct())

    # The items within each of these keys should vary together
    by_chap = itemgetter('chapter_id')
    by_phe = itemgetter('phe_code', 'phe_desc', 'phe_id')
    by_icd = itemgetter('icd_code', 'icd_desc')

    # Index set so we can update the chapter data dicts by ID
    chapter_by_id = {c['id']: c for c in chapters}

    # Three tiers of processing: by chapter, by phecode, by icd
    for id_, chap_codes in groupby(events, key=by_chap):
        chapter_dates = set()
        # Generate the chapter's phecodes
        phecodes = []
        for phe_key, phe_events in groupby(chap_codes, key=by_phe):
            phecode_data = {
                'code': phe_key[0],
                'description': phe_key[1],
                'id': phe_key[2],
                'icds': [],
                'total': 0
            }
            for icd_key, icd_events in groupby(phe_events, key=by_icd):
                event_dates = [e['date'] for e in icd_events]
                chapter_dates |= set(event_dates)
                phecode_data['total'] += len(event_dates)
                phecode_data['icds'].append({
                    'code': icd_key[0],
                    'description': icd_key[1],
                    'events': event_dates
                })
            phecodes.append(phecode_data)
        intensity = infer_intensity(chapter_dates)
        chapter_by_id[id_].update({
            'phecodes': phecodes,
            'intensity': intensity
        })

    chapter_list = sorted(chapter_by_id.values(), key=itemgetter('code'))
    return {'chapters': chapter_list}


@add_dategrid
def labs(patient):
    raw = patient.labinstance_set.filter(datetime__date__range=grid_range)
    return {'labs': rollup_labs(raw)}


@add_dategrid
def meds(patient):
    qset = patient.meds.filter(date__range=grid_range)
    return {'meds': rollup_meds(qset)}


@add_dategrid
def cpts(patient):
    events = (patient
              .cptinstance_set
              .filter(date__range=grid_range)
              .annotate(cat=F('code__category'),
                        subcat=F('code__subcategory'),
                        cpt=F('code__code'),
                        desc=F('code__description'))
              .values()
              .order_by('cat', 'subcat', 'cpt', 'date')
              .distinct())
    key = itemgetter('cat', 'subcat', 'cpt', 'desc')
    codes = []
    for (cat, subcat, cpt, desc), evts in groupby(events, key=key):
        datum = dict(cpt=cpt,
                     category=cat,
                     subcategory=subcat,
                     description=desc)
        datum['events'] = sorted(d['date'] for d in evts)
        codes.append(datum)
    return {'cpts': codes}


@add_dategrid
def condition(patient, phecode, relevance=0.75):
    """Returns all the stuff needed for a phecode tab"""
    rdata = defaultdict(list)

    # Handle the ICD codes that constutue the Phecodes
    ids = set()
    codes = set()
    dates = set()
    events = (patient.icdinstance_set
                .filter(date__range=grid_range,
                        code__phecode=phecode)
                .annotate(icd_code=F('code__code'),
                        icd_desc=F('code__description'),
                        icd_id=F('code__id'))
                .values('icd_code', 'icd_desc', 'icd_id', 'date')
                .order_by('icd_code', 'date'))
    key = itemgetter('icd_code', 'icd_desc', 'icd_id')
    for (code, description, id_), evts in groupby(events, key=key):
        ids.add(id_)
        codes.add(code)
        datum = {
            'code': code,
            'description': description,
            'dates': [e['date'] for e in evts],
            'relevance': 1.0
        }
        dates |= set(datum['dates'])
        rdata['base_icds'].append(datum)

    # Run fast intensity over the base codes
    rdata['intensity'] = infer_intensity(dates)

    # Generate the codes identified as relevant and keep highest relevancy
    # score per code
    extras = {'ICD': set(),
              'MED': set()}
    # Always include the chemistries
    extras['LAB'] = CHEM_CODES.copy()
    extras_scores = {}
    for icd in codes:
        for (word, score) in most_similar(icd):
            # Embedding results are sorted by score so this breaks once we
            # get too irrelevant and not before
            if score < relevance:
                break
            prefix, code = disjoin_word(word)
            extras[prefix].add(code)
            if code in extras_scores:
                score = max(extras_scores[code], score)
            extras_scores[code] = score

    # Get the relevant lab instances
    lab_raw = (patient.labinstance_set
               .filter(datetime__date__range=grid_range,
                       code__code__in=extras['LAB']))
    rdata['labs'] = rollup_labs(lab_raw)
    for labset in rdata['labs'].values():
        for lab in labset:
            lab['relevance'] = extras_scores.get(lab['code'], 0)

    # Get the relevant medication instances
    meds_raw = patient.meds.filter(date__range=grid_range,
                                   name__in=extras['MED'])
    rdata['meds'] = rollup_meds(meds_raw)
    for med in rdata['meds']:
        med['relevance'] = extras_scores[med['name']]

    # Get the relevant non-constituent ICD codes
    extra_icd_codes = extras['ICD'] - codes
    extra_icds_insts = (patient.icdinstance_set
                        .filter(date__range=grid_range,
                                code__code__in=extra_icd_codes,
                                code__phecode__isnull=False)
                        .annotate(phecode_id=F('code__phecode_id'),
                                  icd_code=F('code__code'),
                                  icd_desc=F('code__description'))
                        .values('phecode_id', 'icd_code', 'icd_desc', 'date')
                        .order_by('phecode_id', 'icd_code', 'date'))
    key = itemgetter('phecode_id', 'icd_code', 'icd_desc')
    for (id_, code, description), evts in groupby(extra_icds_insts, key=key):
        rdata['extra_icds'].append({
            'phecode_id': id_,
            'code': code,
            'description': description,
            'dates': [e['date'] for e in evts],
            'relevance': extras_scores[code],
        })

    return rdata
