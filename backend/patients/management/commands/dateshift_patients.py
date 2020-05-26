"""
Shift all dates in a given patient's history by the difference between now and
their last mention - so that the patient's history looks more recent.  If no
patient is given, shift the dates for a random patient.
"""
from contextlib import suppress
from datetime import date
from textwrap import dedent

from django.core.management.base import BaseCommand
from django.db import connection
from django.db.models import F

from patients.models import (Patient, ICDInstance, LabInstance, CPTInstance,
                             ClinicalNote, Medication, HeartRate, BMI,
                             BloodPressure)


class Command(BaseCommand):
    help = __doc__
    output_transaction = True

    def add_arguments(self, parser):
        parser.add_argument(
            '--all',
            action='store_true',
            help='Dateshift all sample patients'
        )
        parser.add_argument(
            '--offset',
            type=int,
            default=30,
            help='Perform dateshift if patient has no records '
                 'within the past `offset` days'
        )

    def handle(self, *args, **options):
        num_handled = 0
        if options['all']:
            self.stdout.write('Dateshifting all patients')
            for patient in Patient.objects.filter(is_sample=True):
                num_handled += self.handle_one(patient, options)
        else:
            patient = Patient.objects.first()
            num_handled += self.handle_one(patient, options)
        if num_handled > 0:
            self.stdout.write('=' * 78)
            self.stdout.write(f'{num_handled} total patients shifted')
            # Using the queryset Update method skips the model save method, which
            # makes it MUCH faster but means we still need to do this
            self.stdout.write('Updating Patient Histories...', ending='')
            with connection.cursor() as cursor:
                cursor.execute('REFRESH MATERIALIZED VIEW '
                               'v_patient_history_stats')
            self.stdout.write(self.style.SUCCESS('DONE'))

    def handle_one(self, patient, options):
        dates = []
        with suppress(ICDInstance.DoesNotExist):
            dates.append(patient.icdinstance_set.latest('date').date)

        with suppress(LabInstance.DoesNotExist):
            inst = patient.labinstance_set.latest('datetime')
            dates.append(inst.datetime.date())

        with suppress(CPTInstance.DoesNotExist):
            dates.append(patient.cptinstance_set.latest('date').date)

        with suppress(ClinicalNote.DoesNotExist):
            dates.append(patient.docs.latest('date').date)

        with suppress(Medication.DoesNotExist):
            dates.append(patient.meds.latest('date').date)

        with suppress(HeartRate.DoesNotExist):
            inst = patient.vitals_hr.latest('entry_date')
            dates.append(inst.entry_date.date())

        with suppress(BMI.DoesNotExist):
            inst = patient.vitals_bmi.latest('weight_date')
            dates.append(inst.weight_date.date())

        with suppress(BloodPressure.DoesNotExist):
            inst = patient.vitals_bp.latest('entry_date')
            dates.append(inst.entry_date.date())

        if not dates:
            self.stdout.write(f'No records for patient {patient.id}')
            self.stdout.write('Skipping')
            return 0

        latest = max(dates)
        offset = date.today() - latest

        if offset.days < options['offset']:
            self.stdout.write(f'Patient {patient.id} does not need shifting')
            self.stdout.write('Skipping')
            return 0

        self.stdout.write(f'Dateshifting patient {patient.id} '
                          f'by {offset} day(s)')

        n = patient.icdinstance_set.update(date=F('date') + offset)
        self.stdout.write(f'Updated {n} ICDInstance rows')

        n = patient.labinstance_set.update(datetime=F('datetime') + offset)
        self.stdout.write(f'Updated {n} LabInstance rows')

        n = patient.cptinstance_set.update(date=F('date') + offset)
        self.stdout.write(f'Updated {n} CPTInstance rows')

        n = patient.docs.update(date=F('date') + offset)
        self.stdout.write(f'Updated {n} ClinicalNote rows')

        n = patient.meds.update(date=F('date') + offset)
        self.stdout.write(f'Updated {n} Medication rows')

        n = patient.vitals_hr.update(entry_date=F('entry_date') + offset)
        self.stdout.write(f'Updated {n} HeartRate rows')

        n = patient.vitals_bmi.update(
            weight_date=F('weight_date') + offset,
            height_date=F('height_date') + offset
        )
        self.stdout.write(f'Updated {n} BMI rows')

        n = patient.vitals_bp.update(entry_date=F('entry_date') + offset)
        self.stdout.write(f'Updated {n} BloodPressure rows')
        self.stdout.write(self.style.SUCCESS('DONE'))
        return 1
