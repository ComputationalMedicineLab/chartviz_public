from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Phecode, ICD

class PhecodeSerializer(ModelSerializer):
    class Meta:
        model = Phecode
        fields = ('id', 'code', 'description')


class ICDSerializer(ModelSerializer):
    phecode = PhecodeSerializer()

    class Meta:
        model = ICD
        fields = ('id', 'code', 'description', 'phecode')


class ICDViewSet(ReadOnlyModelViewSet):
    queryset = ICD.objects.all()
    serializer_class = ICDSerializer
