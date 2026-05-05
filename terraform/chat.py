import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize Bedrock client
bedrock_runtime = boto3.client('bedrock-runtime', region_name='us-east-1')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    AWS Lambda handler for AI-powered resume chat assistant
    """
    
    # CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
    }
    
    try:
        # Handle OPTIONS request for CORS
        if event.get('httpMethod') == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': headers,
                'body': ''
            }
        
        # Parse the request body
        if 'body' not in event:
            raise ValueError("No body in request")
            
        body = json.loads(event['body'])
        user_question = body.get('question', '').strip()
        
        if not user_question:
            raise ValueError("No question provided")
        
        logger.info(f"Processing question: {user_question}")
        
        # Get AI response
        ai_response = get_ai_response(user_question)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'response': ai_response,
                'question': user_question
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({
                'error': 'Sorry, I encountered an error processing your question. Please try again.',
                'details': str(e)
            })
        }

def get_ai_response(user_question: str) -> str:
    """
    Get AI response using AWS Bedrock Claude model
    """
    
    # Comprehensive resume context
    resume_context = """
    You are an AI assistant representing Brent Ingram's professional profile. Answer questions about his experience, skills, and projects based on this information:

    PROFESSIONAL SUMMARY:
    Brent Ingram is a Cloud Engineer and DevOps professional with expertise in AWS cloud infrastructure, Infrastructure as Code, and modern development practices.

    TECHNICAL SKILLS:
    - Cloud Platforms: AWS (S3, Lambda, CloudFront, Route 53, API Gateway, DynamoDB, EC2, RDS, EFS)
    - Infrastructure as Code: Terraform, CloudFormation
    - CI/CD: GitHub Actions, Azure DevOps
    - Programming: Python, JavaScript, HTML/CSS
    - Containerization: Docker
    - Monitoring: New Relic, CloudWatch
    - Version Control: Git, GitHub
    - Databases: DynamoDB, RDS, SQL
    - Networking: DNS, CDN, Load Balancers
    - Security: IAM, SSL/TLS, CORS

    KEY PROJECTS:
    1. Cloud Resume Challenge Website (Current Project):
       - Built serverless website using S3, CloudFront, Route 53
       - Implemented visitor counter with Lambda, API Gateway, DynamoDB
       - Full Infrastructure as Code with Terraform
       - CI/CD pipeline with GitHub Actions
       - Custom domain with SSL certificate
       - Cost-optimized architecture (~$2-3/month)

    2. AWS Backup Strategy Implementation:
       - Designed cross-account backup architecture
       - Implemented immutable backup storage
       - Automated backup policies with Terraform
       - Cross-region disaster recovery

    3. DNS Failover Implementation:
       - Built automatic failover to S3 maintenance pages
       - Route 53 health checks and failover routing
       - Load balancer integration

    4. ServiceNow Integration:
       - AWS backup event integration with ServiceNow
       - EventBridge, SNS, and CloudWatch implementation
       - Automated incident creation and alerting

    BLOG POSTS & TECHNICAL WRITING:
    - "Building My Cloud Resume Challenge: A Complete AWS Infrastructure Journey"
    - "Implementing DNS Failover with AWS Load Balancers and S3 Maintenance Pages"
    - "How to Send AWS Backup Events to ServiceNow"
    - "Designing a Scalable AWS Backup Strategy with Cross-Account Immutability"
    - Various posts on CI/CD, Docker, Infrastructure as Code, and development practices

    CERTIFICATIONS & LEARNING:
    - Actively pursuing AWS certifications, has achieved the cert called AWS Solutions Architect Associate
    - Continuous learning in cloud technologies
    - Hands-on experience with production workloads

    APPROACH & PHILOSOPHY:
    - Infrastructure as Code advocate
    - Believes in automation and reproducible deployments
    - Security-first mindset with least privilege principles
    - Cost optimization and efficiency focus
    - Documentation and knowledge sharing

    CURRENT FOCUS:
    - Advanced AWS services and architectures
    - Serverless computing and microservices
    - AI/ML integration with cloud infrastructure
    - Modern DevOps practices and tooling

    Please provide helpful, professional responses about Brent's qualifications, experience, and technical capabilities. Be conversational but informative, and highlight relevant skills based on what the person is asking about.
    """
    
    # Create the prompt for Claude
    prompt = f"""
    {resume_context}

    Human: {user_question}

    Assistant: I'd be happy to help you learn more about Brent Ingram's professional background! """
    
    try:
        # Call Bedrock Claude model
        response = bedrock_runtime.invoke_model(
            modelId='us.anthropic.claude-haiku-4-5-20251001-v1:0',  # Using Haiku for cost efficiency
            body=json.dumps({
                'anthropic_version': 'bedrock-2023-05-31',
                'max_tokens': 500,
                'messages': [
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'temperature': 0.7
            })
        )
        
        # Parse the response
        response_body = json.loads(response['body'].read())
        ai_response = response_body['content'][0]['text']
        
        logger.info("Successfully generated AI response")
        return ai_response
        
    except Exception as e:
        logger.error(f"Error calling Bedrock: {str(e)}")
        return "I'm sorry, I'm having trouble accessing my knowledge base right now. Please try asking your question again, or feel free to explore Brent's resume and blog posts directly on the website."

def lambda_handler(event, context):
    """
    Main Lambda handler (alternative entry point)
    """
    return handler(event, context)