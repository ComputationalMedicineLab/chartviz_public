"""
Generate fake patients and load the data in the resources/patients dir for use
in dev / prototyping.
"""
import csv
import os
from datetime import timedelta
from random import random, randint, sample
from os.path import abspath, basename, dirname, join

from django.core.management.base import BaseCommand, CommandError
from django.utils.dateparse import parse_date, parse_datetime
from django.utils.timezone import make_aware
from faker import Faker
from tqdm import tqdm
from taxonomies.models import ICD, Lab, CPT
from patients.models import (Patient, ICDInstance, LabInstance, CPTInstance,
                             ClinicalNote, Medication, HeartRate, BMI,
                             BloodPressure)

BASE = dirname(dirname(dirname(__file__)))
PDIR = abspath(join(BASE, 'resources', 'patients'))


def float_or_none(arg):
    try:
        return float(arg)
    except (TypeError, ValueError):
        return None


class Command(BaseCommand):
    # Reuse the module docstring
    help = __doc__

    # wrap the command in a transaction
    output_transaction = True

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._factory = Faker()

    @property
    def icd_mapping(self):
        if not hasattr(self, '_icd_mapping'):
            self._icd_mapping = {icd.code: icd for icd in ICD.objects.all()}
        return self._icd_mapping

    @property
    def lab_mapping(self):
        if not hasattr(self, '_lab_mapping'):
            self._lab_mapping = {lab.code: lab for lab in Lab.objects.all()}
        return self._lab_mapping

    @property
    def cpt_mapping(self):
        if not hasattr(self, '_cpt_mapping'):
            self._cpt_mapping = {cpt.code: cpt for cpt in CPT.objects.all()}
        return self._cpt_mapping

    def handle(self, *args, **options):
        self.stdout.write('Cleaning up old samples... ', ending='')
        Patient.objects.filter(is_sample=True).delete()
        self.stdout.write(self.style.SUCCESS('DONE'))
        self.stdout.write('Generating new samples...')

        ids = [x for x in os.listdir(PDIR) if x.startswith('R')]
        for id_ in tqdm(ids):
            grid = id_.replace('R', '#')
            patient = self.gen_patient(grid)
            patient.save()
            self.load_cpts(patient, join(PDIR, id_, 'cpts.csv'))
            self.load_docs(patient, join(PDIR, id_, 'docs.csv'))
            self.load_icds(patient, join(PDIR, id_, 'icds.csv'))
            self.load_labs(patient, join(PDIR, id_, 'labs.csv'))
            self.load_meds(patient, join(PDIR, id_, 'meds.csv'))
            self.load_hr(patient, join(PDIR, id_, 'vitals', 'heart_rate.csv'))
            self.load_bp(patient, join(PDIR, id_, 'vitals', 'bp.csv'))
            self.load_bmi(patient, join(PDIR, id_, 'vitals', 'bmi.csv'))

        self.stdout.write(self.style.SUCCESS('DONE'))
        self.stdout.write('Generating Lab IQRs from instances')
        LabInstance.update_percentiles()
        self.stdout.write('Generating Medication descriptions & strengths')
        Medication.gen_descriptions()
        Medication.gen_strength_nums()
        self.stdout.write(self.style.SUCCESS('DONE'))

    def gen_patient(self, mrn):
        patient = Patient()
        patient.mrn = mrn
        if randint(0, 1):
            patient.gender = 'male'
            patient.first_name = self._factory.first_name_male()
            patient.middle_name = self._factory.first_name_male()
        else:
            patient.gender = 'female'
            patient.first_name = self._factory.first_name_female()
            patient.middle_name = self._factory.first_name_female()
        patient.last_name = self._factory.last_name()
        offset = timedelta(days=randint(28, 67) * 365)
        patient.birthdate = (self._factory.date_time_this_century() - offset)
        # Values are in centimeters
        patient.height = randint(140, 180)
        # Values are in kg
        patient.weight = randint(60, 90) + round(random(), 2)
        patient.is_sample = True
        return patient

    def load_cpts(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader)  # toss the header
            for (date, code) in reader:
                if code not in self.cpt_mapping:
                    continue
                inst = CPTInstance(patient=patient)
                inst.date = parse_date(date)
                inst.code = self.cpt_mapping[code]
                instances.append(inst)
        CPTInstance.objects.bulk_create(instances)

    def load_docs(self, patient, path):
        docs = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader)
            for (date, doc_type, sub_type, content) in reader:
                inst = ClinicalNote(patient=patient)
                inst.date = parse_date(date)
                inst.doc_type = doc_type
                inst.sub_type = sub_type
                inst.content = content
                docs.append(inst)
        ClinicalNote.objects.bulk_create(docs)

    def load_icds(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader) # toss the header
            for (date, code) in reader:
                if code not in self.icd_mapping:
                    continue
                inst = ICDInstance(patient=patient)
                inst.date = parse_date(date)
                inst.code = self.icd_mapping[code]
                instances.append(inst)
        ICDInstance.objects.bulk_create(instances)

    def load_labs(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader)  # toss the header
            for (dt, code, value, unit, normal_min, normal_max) in reader:
                if code not in self.lab_mapping:
                    continue
                inst = LabInstance(patient=patient, unit=unit)
                inst.datetime = make_aware(parse_datetime(dt))
                inst.code = self.lab_mapping[code]
                # For each of the following, if the field is defined, convert
                # it to a float.  Otherwise it's None (i.e. null)
                inst.value = float_or_none(value)
                inst.normal_min = float_or_none(normal_min)
                inst.normal_max = float_or_none(normal_max)
                instances.append(inst)
        LabInstance.objects.bulk_create(instances)

    def load_meds(self, patient, path):
        meds = []
        with open(path, newline='') as fd:
            for row in csv.DictReader(fd):
                inst = Medication(patient=patient, **row)
                inst.date = parse_date(row.pop('date'))
                meds.append(inst)
        Medication.objects.bulk_create(meds)

    def load_hr(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader) # Toss headers
            for (dt, name, value) in reader:
                inst = HeartRate(patient=patient, name=name, value=int(value))
                inst.entry_date = make_aware(parse_datetime(dt))
                instances.append(inst)
        HeartRate.objects.bulk_create(instances)

    def load_bp(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader)
            for (dt, value, status, code, syst, dias) in reader:
                inst = BloodPressure(patient=patient)
                inst.entry_date = make_aware(parse_datetime(dt))
                inst.value = value
                inst.status = status
                inst.status_code = int(code)
                inst.systolic = int(syst)
                inst.diastolic = int(dias)
                instances.append(inst)
        BloodPressure.objects.bulk_create(instances)

    def load_bmi(self, patient, path):
        instances = []
        with open(path, newline='') as fd:
            reader = csv.reader(fd)
            next(reader)
            for (w, wdt, h, hdt, bmi) in reader:
                inst = BMI(patient=patient)
                inst.weight = float(w)
                inst.weight_date = make_aware(parse_datetime(wdt))
                inst.height = float(h)
                inst.height_date = make_aware(parse_datetime(hdt))
                inst.bmi = float(bmi)
                instances.append(inst)
        BMI.objects.bulk_create(instances)
