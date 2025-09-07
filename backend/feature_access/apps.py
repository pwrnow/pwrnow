from django.apps import AppConfig


class FeatureAccessConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'feature_access'
    verbose_name = 'Feature Access Control'
    
    def ready(self):
        import feature_access.signals