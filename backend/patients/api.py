"""
API Endpoints related to retrieving patient information and histories.
"""
from datetime import timedelta

from django.db.models import F, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import action, api_view
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.serializers import (ModelSerializer,
                                        HyperlinkedModelSerializer,
                                        HyperlinkedIdentityField as Link,
                                        ReadOnlyField)
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Patient, HistoryStats
from . import tabs


class PatientSerializer(HyperlinkedModelSerializer):
    id = ReadOnlyField()
    overview = Link(view_name='patient-overview')
    systems = Link(view_name='patient-systems')
    labs = Link(view_name='patient-labs')
    meds = Link(view_name='patient-meds')
    vitals = Link(view_name='patient-vitals')
    cpts = Link(view_name='patient-cpts')
    conditions = Link(view_name='patient-condition')
    notes = Link(view_name='patient-notes')

    class Meta:
        model = Patient
        exclude = ('icds', )


class HistoryStatsSerializer(ModelSerializer):

    class Meta:
        model = HistoryStats
        fields = '__all__'


class PatientViewSet(ReadOnlyModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    filter_backends = (SearchFilter,)
    search_fields = ('first_name', 'middle_name', 'last_name', 'mrn')

    @action(detail=True, url_path='code-search')
    def code_search(self, request, pk=None):
        """Returns all relevant / matching codes from the patient history"""
        ctx = dict(request=request)
        term = request.query_params.get('term')
        if not term:
            return Response({'results': []})
        patient = self.get_object()
        search = (Q(code__icontains=term)
                  | Q(description__icontains=term)
                  | Q(kind__icontains=term))
        events = HistoryStats.objects.filter(search, patient_id=patient.id)
        serialized = HistoryStatsSerializer(events, many=True, context=ctx)
        return Response({'results': serialized.data})

    @action(detail=True)
    def overview(self, request, pk=None):
        patient = self.get_object()
        response_data = tabs.overview(patient)
        return Response(response_data)

    @action(detail=True)
    def systems(self, request, pk=None):
        return Response(tabs.systems(self.get_object()))

    @action(detail=True)
    def labs(self, request, pk=None):
        return Response(tabs.labs(self.get_object()))

    @action(detail=True)
    def meds(self, request, pk=None):
        return Response(tabs.meds(self.get_object()))

    @action(detail=True)
    def vitals(self, request, pk=None):
        patient = self.get_object()
        heart_rate = (patient.vitals_hr
                      .filter(name='Pulse')
                      .annotate(date=F('entry_date'))
                      .order_by('date')
                      .values('date', 'value'))
        respiratory_rate = (patient.vitals_hr
                            .filter(name='RespRt')
                            .annotate(date=F('entry_date'))
                            .order_by('date')
                            .values('date', 'value'))
        blood_pressure = (patient.vitals_bp
                          .annotate(date=F('entry_date'))
                          .order_by('date')
                          .values('date', 'status', 'systolic', 'diastolic'))
        bmi = (patient.vitals_bmi
               .annotate(date=F('weight_date'),
                         value=F('bmi'),
                         weightDate=F('weight_date'),
                         heightDate=F('height_date'))
               .order_by('weightDate', 'heightDate')
               .values('date', 'value',
                       'weightDate', 'weight',
                       'heightDate', 'height'))
        return Response({'heartRate': heart_rate,
                         'respiratoryRate': respiratory_rate,
                         'bloodPressure': blood_pressure,
                         'bmi': bmi})

    @action(detail=True)
    def cpts(self, request, pk=None):
        return Response(tabs.cpts(self.get_object()))

    @action(detail=True)
    def condition(self, request, pk=None):
        """Sends back all the ICD events for a given Phecode"""
        code = request.query_params.get('code')
        if not code:
            return Response({})
        patient = self.get_object()
        return Response(tabs.condition(patient, code, 0.2))

    @action(detail=True)
    def notes(self, request, pk=None):
        date = request.query_params.get('date')
        if not date:
            return Response({})
        date = parse_date(date)
        patient = self.get_object()
        # XXX: This exclude clause prunes certain types of perfunctory, overly
        # common note types from the clinical docs data. Unfortunately the
        # exact means of doing so is dataset dependent; this will need to be
        # altered to match your own data.

        # notes_base = patient.docs.exclude(
        #       Q(doc_type='CC')
        #     | Q(doc_type='HP', sub_type__icontains='clinical communication')
        #     | Q(doc_type='HP', sub_type__icontains='provider communication')
        #     | Q(doc_type='HP', sub_type__icontains='braden')
        # )
        notes_base = patient.docs
        notes = notes_base.filter(date=date)
        for i in range(1, 4):
            if notes:
                break
            offset = timedelta(days=i)
            date_range = (date - offset, date + offset)
            notes = notes_base.filter(date__range=date_range)
        notes = notes.values('date', 'doc_type', 'sub_type')
        return Response({'notes': notes})
