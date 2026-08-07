# from django.apps import AppConfig
# # from knowledge_article.signals import *


# class KnowledgeArticleConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'knowledge_article'

#     def ready(self):
#         import knowledge_article.signals
from django.apps import AppConfig

class KnowledgeArticleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'knowledge_article'

    def ready(self):
        import knowledge_article.signals  # ensures signal is loaded

    # def ready(self):
    #     try:
    #         import knowledge_article.signals
    #     except ImportError:
    #         pass
