variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
  sensitive   = true
}

variable "knowledge_base_id" {
  description = "Bedrock Knowledge Base ID"
  type        = string
  sensitive   = true
}

variable "guardrail_id" {
  description = "Bedrock Guardrail ID"
  type        = string
  sensitive   = true
}

variable "data_source_id" {
  description = "Bedrock Knowledge Base data source ID"
  type        = string
  sensitive   = true
}
