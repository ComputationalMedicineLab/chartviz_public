"""
Store per-user account information & settings
"""
from django.contrib.auth.models import User, Group
from django.db.models import Model, FloatField, ForeignKey, CASCADE

from patients.models import Patient
from taxonomies.models import Phecode


class ConditionTabSpec(Model):
    """
    Stores information about what Conditions Tabs this each user likes to
    have open per patient and at what threshold
    """
    user = ForeignKey(User, on_delete=CASCADE)
    patient = ForeignKey(Patient, on_delete=CASCADE)
    condition = ForeignKey(Phecode, on_delete=CASCADE)
    threshold = FloatField(default=0.75)

    class Meta:
        unique_together = ('user', 'patient', 'condition')
