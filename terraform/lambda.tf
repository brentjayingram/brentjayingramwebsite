# Reference existing Lambda function
data "aws_lambda_function" "visitor_counter" {
  function_name = "visitorcount"
}

# Update the existing Lambda function's IAM role with proper permissions
resource "aws_iam_role_policy" "visitor_lambda_dynamodb_policy" {
  name = "visitor-lambda-dynamodb-policy"
  role = "visitorcount-role-kznqyqzv"  # The existing role name from your error

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:GetItem"
        ]
        Resource = aws_dynamodb_table.visitor_tracking.arn
      }
    ]
  })
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "visitor_api" {
  name        = "visitor-tracking-api"
  description = "API for visitor tracking"
}

# API Gateway Resource
resource "aws_api_gateway_resource" "visitor_resource" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  parent_id   = aws_api_gateway_rest_api.visitor_api.root_resource_id
  path_part   = "track-visitor"
}

# API Gateway Method (GET)
resource "aws_api_gateway_method" "visitor_get" {
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  resource_id   = aws_api_gateway_resource.visitor_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Method (POST)
resource "aws_api_gateway_method" "visitor_post" {
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  resource_id   = aws_api_gateway_resource.visitor_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Integration (GET)
resource "aws_api_gateway_integration" "visitor_get_integration" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.visitor_resource.id
  http_method = aws_api_gateway_method.visitor_get.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = data.aws_lambda_function.visitor_counter.invoke_arn
}

# API Gateway Integration (POST)
resource "aws_api_gateway_integration" "visitor_post_integration" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.visitor_resource.id
  http_method = aws_api_gateway_method.visitor_post.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = data.aws_lambda_function.visitor_counter.invoke_arn
}

# Lambda permission for API Gateway (GET)
resource "aws_lambda_permission" "visitor_api_get_permission" {
  statement_id  = "AllowExecutionFromAPIGatewayGET"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.visitor_counter.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.visitor_api.execution_arn}/*/*"
}

# Lambda permission for API Gateway (POST)
resource "aws_lambda_permission" "visitor_api_post_permission" {
  statement_id  = "AllowExecutionFromAPIGatewayPOST"
  action        = "lambda:InvokeFunction"
  function_name = data.aws_lambda_function.visitor_counter.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.visitor_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "visitor_api_deployment" {
  depends_on = [
    aws_api_gateway_integration.visitor_get_integration,
    aws_api_gateway_integration.visitor_post_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  stage_name  = "dev"
}

# CORS for OPTIONS method
resource "aws_api_gateway_method" "visitor_options" {
  rest_api_id   = aws_api_gateway_rest_api.visitor_api.id
  resource_id   = aws_api_gateway_resource.visitor_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "visitor_options_integration" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.visitor_resource.id
  http_method = aws_api_gateway_method.visitor_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "visitor_options_response" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.visitor_resource.id
  http_method = aws_api_gateway_method.visitor_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "visitor_options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.visitor_api.id
  resource_id = aws_api_gateway_resource.visitor_resource.id
  http_method = aws_api_gateway_method.visitor_options.http_method
  status_code = aws_api_gateway_method_response.visitor_options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}