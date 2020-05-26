"""
Defines models for:
    - ICD9 Chapter Concepts
    - ICD9 Event Concepts
    - Phecode Event Concepts
    - Lab Event Concepts
For the most part these should be considered read only.
The models are populated by the initial_data application.
"""
from django.db.models import (
    Model, CharField, IntegerField,
    ForeignKey, CASCADE, SET_NULL,
)


class CodeType(Model):
    code = CharField(max_length=64, unique=True)
    description = CharField(max_length=4096, default='')

    class Meta:
        abstract = True

    def __repr__(self):
        return f'{self.__class__.__name__}(code={self.code})'

    def __str__(self):
        return f'{self.__class__.__name__}-{self.code}'


class Chapter(CodeType):
    """Represents an ICD9 Chapter event concept"""
    first_parent = CharField(max_length=8)
    last_parent = CharField(max_length=8)
    color = CharField(max_length=8, default='')


class Phecode(CodeType):
    """Represents a PheWas Code event concept"""


class ICD(CodeType):
    """Represents an ICD9 Code event concept"""
    phecode = ForeignKey(Phecode, null=True, on_delete=SET_NULL)
    chapter = ForeignKey(Chapter, null=True, on_delete=SET_NULL)
    # Potentially store this somwhere else
    rank = IntegerField(null=True)

    @property
    def parent(self):
        return self.code.split('.')[0]


class Lab(CodeType):
    """Represents a lab event concept"""
    category = CharField(max_length=256, default='')
    # Potentially store this somwhere else
    rank = IntegerField(default=0)


class CPT(CodeType):
    """Represents a CPT (Current Procedural Terminology) code"""
    category = CharField(max_length=32, null=True)
    subcategory = CharField(max_length=128, null=True)

    @property
    def expired(self):
        return 'EXPIRED' in self.description
