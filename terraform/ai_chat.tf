# AI Chat Lambda Function
resource "aws_lambda_function" "ai_chat" {
  filename         = "ai_chat.zip"
  source_code_hash = filebase64sha256("ai_chat.zip")
  function_name    = "resume-ai-chat"
  role            = aws_iam_role.ai_chat_role.arn
  handler         = "chat.handler"
  runtime         = "python3.11"
  timeout         = 30

  depends_on = [
    aws_iam_role_policy_attachment.ai_chat_basic_attach,
    aws_iam_role_policy_attachment.ai_chat_bedrock_attach,
  ]
}

# IAM role for AI Chat Lambda
resource "aws_iam_role" "ai_chat_role" {
  name = "ai-chat-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for Bedrock access
resource "aws_iam_policy" "ai_chat_bedrock_policy" {
  name        = "ai-chat-bedrock-policy"
  description = "IAM policy for Lambda to access Bedrock"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = [
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0",
          "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
        ]
      }
    ]
  })
}

# Attach Bedrock policy to AI Chat role
resource "aws_iam_role_policy_attachment" "ai_chat_bedrock_attach" {
  role       = aws_iam_role.ai_chat_role.name
  policy_arn = aws_iam_policy.ai_chat_bedrock_policy.arn
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "ai_chat_basic_attach" {
  role       = aws_iam_role.ai_chat_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# API Gateway Resource for AI Chat
resource "aws_api_gateway_resource" "ai_chat_resource" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  parent_id   = aws_api_gateway_rest_api.visitor_api.root_resource_id
  path_part   = "ai-chat"
}

# API Gateway Method (POST) for AI Chat
resource "aws_api_gateway_method" "ai_chat_post" {
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  resource_id   = aws_api_gateway_resource.ai_chat_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration for AI Chat
resource "aws_api_gateway_integration" "ai_chat_integration" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.ai_chat_resource.id
  http_method = aws_api_gateway_method.ai_chat_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.ai_chat.invoke_arn
}

# Lambda permission for API Gateway (AI Chat)
resource "aws_lambda_permission" "ai_chat_permission" {
  statement_id  = "AllowExecutionFromAPIGatewayAIChat"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ai_chat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.visitor_api.execution_arn}/*/*"
}

# CORS for AI Chat OPTIONS method
resource "aws_api_gateway_method" "ai_chat_options" {
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  resource_id   = aws_api_gateway_resource.ai_chat_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "ai_chat_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.ai_chat_resource.id
  http_method = aws_api_gateway_method.ai_chat_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "ai_chat_options_response" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.ai_chat_resource.id
  http_method = aws_api_gateway_method.ai_chat_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "ai_chat_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.ai_chat_resource.id
  http_method = aws_api_gateway_method.ai_chat_options.http_method
  status_code = aws_api_gateway_method_response.ai_chat_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_deployment" "visitor_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.visitor_get_integration,
    aws_api_gateway_integration.visitor_post_integration,
    aws_api_gateway_integration.ai_chat_integration,
    aws_api_gateway_integration_response.ai_chat_options_integration_response,
  ]

  rest_api_id = aws_api_gateway_rest_api.visitor_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.visitor_resource.id,
      aws_api_gateway_resource.ai_chat_resource.id,
      aws_api_gateway_method.visitor_get.id,
      aws_api_gateway_method.visitor_post.id,
      aws_api_gateway_method.ai_chat_post.id,
      aws_api_gateway_method.ai_chat_options.id,
      aws_api_gateway_integration.visitor_get_integration.id,
      aws_api_gateway_integration.visitor_post_integration.id,
      aws_api_gateway_integration.ai_chat_integration.id,
      aws_api_gateway_integration.ai_chat_options_integration.id,
      aws_api_gateway_method_response.ai_chat_options_response.id,
      aws_api_gateway_integration_response.ai_chat_options_integration_response.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "visitor_api_stage" {
  deployment_id = aws_api_gateway_deployment.visitor_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  stage_name    = "dev"
}