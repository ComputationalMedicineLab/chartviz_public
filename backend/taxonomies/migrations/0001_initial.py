# Generated by Django 2.0.7 on 2018-08-31 20:52

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Chapter',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=64, unique=True)),
                ('description', models.CharField(default='', max_length=4096)),
                ('first_parent', models.CharField(max_length=8)),
                ('last_parent', models.CharField(max_length=8)),
                ('color', models.CharField(default='', max_length=8)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='ICD',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=64, unique=True)),
                ('description', models.CharField(default='', max_length=4096)),
                ('rank', models.IntegerField(default=0)),
                ('chapter', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='taxonomies.Chapter')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Lab',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=64, unique=True)),
                ('description', models.CharField(default='', max_length=4096)),
                ('category', models.CharField(default='', max_length=256)),
                ('rank', models.IntegerField(default=0)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='Phecode',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('code', models.CharField(max_length=64, unique=True)),
                ('description', models.CharField(default='', max_length=4096)),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.AddField(
            model_name='icd',
            name='phecode',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='taxonomies.Phecode'),
        ),
    ]
