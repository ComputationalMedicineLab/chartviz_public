"""
Runs raw sql to refresh the materialized db view v_patient_history_stats, which
aggregates a number of items per patient from other tables.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

class Command(BaseCommand):
    # Reuse the module docstring
    help = __doc__

    # wrap the command in a transaction
    output_transaction = True

    def handle(self, *args, **kwargs):
        self.stdout.write('Refreshing patient history view...')
        with connection.cursor() as cursor:
            cursor.execute('REFRESH MATERIALIZED VIEW v_patient_history_stats')
        self.stdout.write(self.style.SUCCESS('DONE'))
