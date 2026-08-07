from django.shortcuts import render
from. serializers import KnowledgeArticleSerializer
from. models import KnowledgeArticle
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from roles_creation.permissions import HasRolePermission


class KnowledgeAPI(APIView):
    permission_classes= [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    


    def get(self, request, article_id=None):
        self.permission_required = "create_knowledge_article"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
 
        if article_id is not None:  # Checking if article_id is provided
            try:
                # Retrieve the specific KnowledgeArticle
                article = KnowledgeArticle.objects.get(article_id=article_id)
                serializer = KnowledgeArticleSerializer(article)  
                return Response(serializer.data)
            except KnowledgeArticle.DoesNotExist:
                # Return 404 if the article is not found
                return Response({'error': 'Knowledge article not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # If no article_id is provided, retrieve all KnowledgeArticles
        articles = KnowledgeArticle.objects.all()
        serializer = KnowledgeArticleSerializer(articles, many=True) 
        return Response(serializer.data)
    



    def post(self, request):
        self.permission_required = "create_knowledge_article"

        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = KnowledgeArticleSerializer(data=request.data)
        if serializer.is_valid():
            article = serializer.save(created_by=request.user, modified_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


    def put(self, request, article_id):
        self.permission_required = "update_knowledge_article"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
 
        try:
            article = KnowledgeArticle.objects.get(article_id=article_id)
        except KnowledgeArticle.DoesNotExist:
            return Response({"error": "Article not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = KnowledgeArticleSerializer(article, data=request.data, partial=True)
        if serializer.is_valid():
            article=serializer.save(created_by=request.user, updated_by=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, article_id):
        self.permission_required = "delete_knowledge_article"
    
        if not HasRolePermission().has_permission(request, self.permission_required):
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            article = KnowledgeArticle.objects.get(article_id=article_id)  
            article.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except KnowledgeArticle.DoesNotExist:
            return Response({"error": "Article not found."}, status=status.HTTP_404_NOT_FOUND)




from django.db.models import Q, Subquery, OuterRef
from rest_framework.decorators import api_view


@api_view(['GET'])
def search_knowledge_articles(request):
    query = request.GET.get('q', '')
    subquery_param = request.GET.get('subquery', '')
    
    articles = KnowledgeArticle.objects.all()

    if query:
        articles = articles.filter(
            Q(title__icontains=query) |
            Q(solution__icontains=query) |
            Q(cause_of_issue__icontains=query) |
            Q(category__name__icontains=query) 
            # Q(created_by__username__icontains(query)) |
            # Q(modified_by__username__icontains(query))
        )

    if subquery_param:
        subquery = KnowledgeArticle.objects.filter(
            created_by=OuterRef('created_by'),
            title__icontains=subquery_param
        ).values('created_by')
        
        articles = articles.filter(
            created_by__in=Subquery(subquery)
        )

    serializer = KnowledgeArticleSerializer(articles, many=True)
    return Response(serializer.data)
      
   