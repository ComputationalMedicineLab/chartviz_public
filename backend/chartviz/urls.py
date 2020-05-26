"""chartviz URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from . import views as core
from accounts.api import current_user, manage_tabs, delete_tab
from patients.api import PatientViewSet
from taxonomies.api import ICDViewSet


router = DefaultRouter()
router.register(r'patient', PatientViewSet)
router.register(r'codes/icd', ICDViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Internal Auth
    path('accounts/', include('django.contrib.auth.urls')),

    # Mount the API router & other API routes
    path('api/v1/', include(router.urls)),
    path('api/v1/users/me/', current_user),

    # Condition tab preference api
    path('api/v1/tabs/<int:patient_id>/', manage_tabs),
    path('api/v1/tabs/<int:patient_id>/<int:condition_id>/', delete_tab),

    # Match everything forwards to the client-side React app
    re_path(r'', core.catchall),
]
