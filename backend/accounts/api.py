from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer

from taxonomies.api import PhecodeSerializer
from .models import ConditionTabSpec


class ConditionTabSpecSerializer(ModelSerializer):
    condition = PhecodeSerializer()

    class Meta:
        model = ConditionTabSpec
        fields = ('id', 'user', 'patient', 'condition', 'threshold')


def _list_tabs(user_id, patient_id):
    specs = ConditionTabSpecSerializer(
        ConditionTabSpec.objects.filter(user=user_id, patient=patient_id),
        many=True
    )
    return Response({'tabspecs': specs.data})


@api_view(['GET', 'POST'])
def manage_tabs(request, patient_id=None):
    patient_id = int(patient_id)
    if request.method == 'POST':
        condition_id = int(request.data['condition_id'])
        tab, created = ConditionTabSpec.objects.get_or_create(
            user=request.user,
            patient_id=patient_id,
            condition_id=condition_id
        )
        threshold = request.data.get('threshold')
        if threshold:
            tab.threshold = float(threshold)
        tab.save()
    return _list_tabs(request.user.id, patient_id)


@api_view(['DELETE'])
def delete_tab(request, patient_id=None, condition_id=None):
    patient_id = int(patient_id)
    condition_id = int(condition_id)
    tab = ConditionTabSpec.objects.filter(
        user=request.user,
        patient_id=patient_id,
        condition_id=condition_id,
    )
    tab.delete()
    return _list_tabs(request.user.id, patient_id)


@api_view()
def current_user(request):
    return Response({
        'id': request.user.id,
        'username': request.user.username,
        'email': request.user.email
    })
