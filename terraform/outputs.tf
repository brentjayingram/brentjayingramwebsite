output "website_url" {
  value = aws_s3_bucket_website_configuration.website.website_endpoint
}

output "bucket_name" {
  value = aws_s3_bucket.website.id
}

output "api_gateway_url" {
  value = "${aws_api_gateway_rest_api.visitor_api.execution_arn}/dev/track-visitor"
  description = "API Gateway URL for visitor tracking"
}

output "lambda_function_name" {
  value = data.aws_lambda_function.visitor_counter.function_name
  description = "Lambda function name for visitor tracking"
}