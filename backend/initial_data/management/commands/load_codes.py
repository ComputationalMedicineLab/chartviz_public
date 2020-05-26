"""
Load up all the code taxonomies (ICD, CPT, Labs)
"""
import csv
from datetime import timedelta
from random import random, randint, sample
from os.path import abspath, basename, dirname, join

from django.core.management.base import BaseCommand, CommandError
from tqdm import tqdm

from taxonomies.models import Chapter, Phecode, ICD, Lab, CPT

BASE = abspath(dirname(dirname(dirname(__file__))))
CODES_DIR = join(BASE, 'resources', 'codes')

lab_category_map = {
  "Creat"  : "Chemistry",
  "Gluc"   : "Chemistry",
  "K"      : "Chemistry",
  "Na"     : "Chemistry",
  "BUN"    : "Chemistry",
  "CO2"    : "Chemistry",
  "Cl"     : "Chemistry",
  "Ca"     : "Chemistry",
  "AN-GAP" : "Chemistry",
  "Alb"    : "Chemistry",
  "PCV"    : "Complete Blood Count",
  "Hgb"    : "Complete Blood Count",
  "WBC"    : "Complete Blood Count",
  "MCV"    : "Complete Blood Count",
  "RBC"    : "Complete Blood Count",
  "MCH"    : "Complete Blood Count",
  "MCHC"   : "Complete Blood Count",
  "RDW"    : "Complete Blood Count",
  "Plt-Ct" : "Complete Blood Count",
  "UpH"    : "Complete Blood Count",
  "USpGr"  : "Complete Blood Count",
  "NTAuto" : "Complete Blood Count 2",
  "RDWSD"  : "Complete Blood Count 2",
  "NRBC"   : "Complete Blood Count 2",
  "NRBC#"  : "Complete Blood Count 2",
  "MPV"    : "Complete Blood Count 2",
  "NEUTAB" : "Complete Blood Count 3",
  "MONORE" : "Complete Blood Count 3",
  "NEUTRE" : "Complete Blood Count 3",
  "MONOAB" : "Complete Blood Count 3",
  "BASORE" : "Complete Blood Count 3",
  "BASOAB" : "Complete Blood Count 3",
  "LYMPRE" : "Complete Blood Count 3",
  "LYMPAB" : "Complete Blood Count 3",
  "TBil"   : "Liver Function Tests",
  "SGOT"   : "Liver Function Tests",
  "SGPT"   : "Liver Function Tests",
  "AlkP"   : "Liver Function Tests",
}

class Command(BaseCommand):
    # Reuse the module docstring
    help = __doc__

    # wrap the command in a transaction
    output_transaction = True

    def handle(self, *args, **options):
        self.stdout.write('Loading ICD Chapters...')
        with open(join(CODES_DIR, 'chapters.csv')) as fd:
            Chapter.objects.bulk_create([
                Chapter(**ch) for ch in tqdm(csv.DictReader(fd))
            ])
        self.stdout.write(self.style.SUCCESS('DONE'))

        self.stdout.write('Loading Phecodes...')
        with open(join(CODES_DIR, 'phecodes.csv')) as fd:
            Phecode.objects.bulk_create([
                Phecode(**ph) for ph in tqdm(csv.DictReader(fd))
            ])
        self.stdout.write(self.style.SUCCESS('DONE'))

        self.stdout.write('Loading ICD Codes...')
        icds = []
        with open(join(CODES_DIR, 'icds.csv')) as fd:
            _, *code_data = csv.reader(fd)
        for (code, description, chapter, phecode, rank) in tqdm(code_data):
            new_code = ICD(code=code, description=description)
            if rank:
                new_code.rank = int(rank)
            if phecode:
                new_code.phecode = Phecode.objects.get(code=phecode)
            if chapter:
                new_code.chapter = Chapter.objects.get(code=chapter)
            icds.append(new_code)
        ICD.objects.bulk_create(icds)
        self.stdout.write(self.style.SUCCESS('DONE'))

        self.stdout.write('Loading Lab Codes...')
        labs = []
        with open(join(CODES_DIR, 'labs.csv')) as fd:
            data = list(csv.DictReader(fd))
        for item in tqdm(data):
            rank = item.pop('rank')
            lab = Lab(**item)
            if rank:
                lab.rank = int(rank)
            lab.category = lab_category_map.get(lab.code, '')
            labs.append(lab)
        Lab.objects.bulk_create(labs)
        self.stdout.write(self.style.SUCCESS('DONE'))

        self.stdout.write('Loading CPT Codes...')
        with open(join(CODES_DIR, 'cpts.csv')) as fd:
            CPT.objects.bulk_create([
                CPT(**item) for item in tqdm(csv.DictReader(fd))
            ])
        self.stdout.write(self.style.SUCCESS('DONE'))
