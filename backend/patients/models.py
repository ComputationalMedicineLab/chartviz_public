"""
Provides models to represent Patients and the concrete information we have
about them.
"""
from textwrap import dedent
from django.db import connection
from django.db.models import (
    Model, CASCADE,
    ForeignKey, ManyToManyField, BigIntegerField, BooleanField,
    CharField, DateField, DateTimeField, FloatField, IntegerField, TextField
)
from taxonomies.models import ICD, Lab, CPT


class Patient(Model):
    """Stores basic information for a single patient."""
    # Basic identifiers
    first_name = CharField(max_length=32, blank=False)
    middle_name = CharField(max_length=32, blank=True)
    last_name = CharField(max_length=128, blank=False)
    mrn = CharField(max_length=32, unique=True)

    # Demographics information
    birthdate = DateField(null=True)
    gender = CharField(
        choices=(
            ('female', 'female'),
            ('male', 'male'),
            ('other', 'other or N/A'),
        ),
        max_length=16,
        null=True,
    )

    # Indicates that this patient object is a test / prototype sample and not a
    # real patient
    is_sample = BooleanField()

    # Patient History
    icds = ManyToManyField(ICD, through='ICDInstance')
    labs = ManyToManyField(Lab, through='LabInstance')
    cpts = ManyToManyField(CPT, through='CPTInstance')
    # Also available: meds, docs

    def __repr__(self):
        fmt = '{}(first_name={}, last_name={})'
        cls_name = self.__class__.__name__
        return fmt.format(cls_name, self.first_name, self.last_name)

    def __str__(self):
        return f'{self.last_name}, {self.first_name}'


class HistoryStats(Model):
    """
    HistoryStats gives a convenient way to search all Code / Instance types and
    retrieve some very basic aggregate information about them on a per patient
    basis.  This is a materialized view, not a table.
    """
    # N.B. - icd codes MUST have an associated Phecode to be included in this
    # view
    patient_id = BigIntegerField()
    code_id = BigIntegerField()
    kind = CharField(max_length=16)
    code = CharField(max_length=64, primary_key=True)
    description = CharField(max_length=4096)
    count = IntegerField()
    earliest = DateField()
    latest = DateField()

    # we're working with a view, not a real table
    class Meta:
        managed = False
        db_table = 'v_patient_history_stats'


class ICDInstance(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE)
    date = DateField()
    code = ForeignKey(ICD, on_delete=CASCADE)

    def __repr__(self):
        fmt = '{}(patient={}, code={})'
        cls_name = self.__class__.__name__
        return fmt.format(cls_name, self.patient, self.code)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW v_patient_history_stats')


class CPTInstance(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE)
    date = DateField()
    code = ForeignKey(CPT, on_delete=CASCADE)

    def __repr__(self):
        fmt = '{}(patient={}, code={})'
        cls_name = self.__class__.__name__
        return fmt.format(cls_name, self.patient, self.code)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW v_patient_history_stats')


class LabInstance(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE)
    # For many metrics, a granularity at the date level is sufficient, labs
    # however need to include the time
    datetime = DateTimeField()
    code = ForeignKey(Lab, on_delete=CASCADE)
    # This field is prone to corruption
    unit = CharField(max_length=32)
    value = FloatField(null=True)
    # At the time the lab is measured, the normal range (min/max) is recorded
    # as well - this can change per lab w.r.t to the patient b/c of, for
    # example, age bracketing, etc.
    normal_min = FloatField(null=True)
    normal_max = FloatField(null=True)

    perc_10 = FloatField(null=True)
    perc_25 = FloatField(null=True)
    perc_50 = FloatField(null=True)
    perc_75 = FloatField(null=True)
    perc_90 = FloatField(null=True)

    # same as with Instance subtypes
    def __repr__(self):
        fmt = '{}(patient={}, code={})'
        cls_name = self.__class__.__name__
        return fmt.format(cls_name, self.patient, self.code)

    # same as with Instance subtypes
    def save(self, *args, **kwargs):
        super(LabInstance, self).save(*args, **kwargs)
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW v_patient_history_stats')

    @classmethod
    def update_percentiles(cls):
        statement = dedent(f"""\
            UPDATE {cls._meta.db_table} AS A
            SET
                perc_10 = B.p10,
                perc_25 = B.p25,
                perc_50 = B.p50,
                perc_75 = B.p75,
                perc_90 = B.p90
            FROM (
                SELECT
                    code_id,
                    percentile_disc(0.10) WITHIN GROUP (ORDER BY value) AS p10,
                    percentile_disc(0.25) WITHIN GROUP (ORDER BY value) AS p25,
                    percentile_disc(0.50) WITHIN GROUP (ORDER BY value) AS p50,
                    percentile_disc(0.75) WITHIN GROUP (ORDER BY value) AS p75,
                    percentile_disc(0.90) WITHIN GROUP (ORDER BY value) AS p90
                FROM {cls._meta.db_table}
                GROUP BY code_id
            ) AS B
            WHERE A.code_id = B.code_id
        """)
        with connection.cursor() as cursor:
            cursor.execute(statement)


class ClinicalNote(Model):
    """Represents a clinical note / doc"""
    patient = ForeignKey(Patient, on_delete=CASCADE, related_name='docs')
    date = DateField()
    doc_type = CharField(max_length=8)
    sub_type = CharField(max_length=128)
    content = TextField()


class Medication(Model):
    """Represents a medication usage"""
    patient = ForeignKey(Patient, on_delete=CASCADE, related_name='meds')
    date = DateField()
    name = CharField(max_length=64)
    strength = CharField(max_length=64)
    route = CharField(max_length=64)
    frequency = CharField(max_length=64)
    dose = CharField(max_length=64, null=True)
    duration = CharField(max_length=64, null=True)

    # Computed columns stored in db for access speed reasons
    # After loading the samples run the pursuant classmethods
    description = CharField(null=True, max_length=64*4)
    strength_num = FloatField(null=True)

    @classmethod
    def gen_descriptions(cls):
        """Table-wide update the computed description column"""
        with connection.cursor() as cursor:
            cursor.execute(dedent(f"""\
                UPDATE {cls._meta.db_table}
                SET description = CONCAT(
                    name,     ' ',
                    strength, ' ',
                    route,    ' ',
                    frequency
                )
            """))

    @classmethod
    def gen_strength_nums(cls):
        """Table-wide update the computed strength_num column"""
        with connection.cursor() as cursor:
            cursor.execute(dedent(f"""\
                UPDATE {cls._meta.db_table}
                SET strength_num = CAST (
                    SUBSTRING(strength from '\d+\.?\d*')
                    AS DOUBLE PRECISION
                )
            """))

    def __repr__(self):
        desc = ', '.join([f'patient={self.patient}',
                          f'date={self.date}',
                          f'description={self.description}'])
        return f'{self.__class__.__name__}({desc})'

    def save(self, *args, **kwargs):
        super(Medication, self).save(*args, **kwargs)
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW v_patient_history_stats')


class HeartRate(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE, related_name='vitals_hr')
    entry_date = DateTimeField()
    # Always RespRt or Pulse
    name = CharField(max_length=32)
    value = IntegerField()

    @property
    def unit(self):
        """Always BMP for these two tests"""
        return 'BMP'


class BMI(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE, related_name='vitals_bmi')
    weight = FloatField()
    weight_date = DateTimeField()
    height = FloatField()
    height_date = DateTimeField()
    bmi = FloatField()


class BloodPressure(Model):
    patient = ForeignKey(Patient, on_delete=CASCADE, related_name='vitals_bp')
    entry_date = DateTimeField()
    value = CharField(max_length=32)
    status = CharField(max_length=32)
    status_code = IntegerField()
    systolic = IntegerField()
    diastolic = IntegerField()
