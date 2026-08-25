from pathlib import Path
import os

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Security settings
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-+hi)_oc5b4amw)o&%mk__mykl=5#v9f8lyf1oy1of%7$cg3z2(')  # Use an environment variable in production
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# CORS - frontend and backend are served from the same domain in production;
# these origins only matter when running the frontend dev server separately.
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = os.environ.get(
    'CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:8000'
).split(',')
# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'djcelery_email',
    'rest_framework',
    'login_details',
    'timer',
    'solution_groups',
    'roles_creation',
    'organisation_details',
    'knowledge_article',
    'category',
    'priority',
    'personal_details',
    'project_details',
    'resolution',
    'five_notifications',
    'history',
    'services',
    'celery',
    'django_celery_results',
    'cloudinary_storage',
    'cloudinary',
]

MIDDLEWARE = [
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'roles_creation.middlewares.RoleBasedAccessControlMiddleware',
    'corsheaders.middleware.CorsMiddleware',
]

ROOT_URLCONF = 'Ticketing_tool.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            os.path.join(BASE_DIR, '../NxDesk-2026-june-frontend/build'),  # React build output (sibling frontend folder)
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'Ticketing_tool.wsgi.application'

# Database configuration - PostgreSQL via DATABASE_URL when set, otherwise local SQLite
import dj_database_url

DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(default=DATABASE_URL, conn_max_age=600),
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Password validation settings
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',  
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Localization settings
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'

# Collect static files into STATIC_ROOT (for production use)
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, '../NxDesk-2026-june-frontend/build/static'),  # React build output (sibling frontend folder)
]

STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')  # Directory where static files will be collected

# Media files (for uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Authentication settings
AUTH_USER_MODEL = 'login_details.User'

# Email settings
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')

# Celery configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', 'django-db')
CELERY_ACCEPT_CONTENT = ['application/json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Kolkata'
CELERY_CACHE_BACKEND = 'default'

# JWT settings for REST framework
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',  # ✅ correct
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 10,
}

# Cloudinary settings



# Cache settings
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'my_cache_table',
    }
}

# Security settings - flip HTTPS_ENABLED once Certbot/TLS is live (see deployment doc);
# keeping it False lets HTTP-only testing work before the certificate exists.
_https_enabled = os.environ.get('HTTPS_ENABLED', 'False') == 'True'
SECURE_SSL_REDIRECT = _https_enabled
SECURE_HSTS_SECONDS = 31536000 if _https_enabled else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = _https_enabled
SECURE_HSTS_PRELOAD = _https_enabled
CSRF_COOKIE_SECURE = _https_enabled
SESSION_COOKIE_SECURE = _https_enabled
X_FRAME_OPTIONS = 'DENY'

STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
SITE_URL = os.environ.get('SITE_URL', 'http://localhost:8000')

ASGI_APPLICATION = "Ticketing_tool.asgi.application"

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("CHANNEL_LAYERS_REDIS_URL", "redis://127.0.0.1:6379/2")],
        },
    },
}


CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME', ''),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY', ''),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET', ''),
    'SECURE': True,
    'AUTHENTICATED': False,
}

DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
