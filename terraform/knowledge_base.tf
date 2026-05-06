# ---------------------------------------------------------------------------
# Import commands — run these once to bring manually-created resources
# under Terraform management before running terraform apply:
#
#   terraform import aws_s3_bucket.kb_documents brunnyawsnotes
#   terraform import aws_bedrockagent_knowledge_base.resume_kb KNOWLEDGE_BASE_ID
#
# Note: aws_bedrockagent_data_source cannot be imported due to a provider bug.
# The data source (ID: DATA_SOURCE_ID) is managed manually in the AWS console.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# S3 bucket — stores your Obsidian markdown notes
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "kb_documents" {
  bucket = "brunnyawsnotes"
}

# ---------------------------------------------------------------------------
# Bedrock Knowledge Base
# ---------------------------------------------------------------------------

resource "aws_bedrockagent_knowledge_base" "resume_kb" {
  name        = "brunny-aws"
  description = "aws info from brunny"
  role_arn    = "arn:aws:iam::AWS_ACCOUNT_ID:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBaseBrunnyAws"

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
      embedding_model_configuration {
        bedrock_embedding_model_configuration {
          embedding_data_type = "FLOAT32"
        }
      }
    }
  }

  # S3 Vectors is not yet supported by the Terraform AWS provider.
  # This block satisfies the required schema but is never applied —
  # ignore_changes ensures Terraform leaves the real storage config alone.
  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = "arn:aws:aoss:us-east-1:AWS_ACCOUNT_ID:collection/placeholder"
      vector_index_name = "bedrock-knowledge-base-default-index"
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }

  lifecycle {
    ignore_changes = [storage_configuration, knowledge_base_configuration]
  }
}

# ---------------------------------------------------------------------------
# Outputs — knowledge base ID and data source ID for reference in Lambda
# ---------------------------------------------------------------------------

output "knowledge_base_id" {
  value = aws_bedrockagent_knowledge_base.resume_kb.id
}

output "data_source_id" {
  value = "DATA_SOURCE_ID"
}
