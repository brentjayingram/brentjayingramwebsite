# ---------------------------------------------------------------------------
# Import commands — run these once to bring manually-created resources
# under Terraform management before running terraform apply:
#
#   terraform import aws_s3_bucket.kb_documents brunnyawsnotes
#   terraform import aws_bedrockagent_knowledge_base.resume_kb AJKLV1CWPO
#   terraform import aws_bedrockagent_data_source.docs AJKLV1CWPO/PCYECIWUL6
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# S3 bucket — stores your Obsidian markdown notes
# ---------------------------------------------------------------------------

resource "aws_s3_bucket" "kb_documents" {
  bucket = "brunnyawsnotes"
}

# ---------------------------------------------------------------------------
# Bedrock Knowledge Base
#
# BEFORE running terraform plan, fill in the two placeholder values below:
#
# role_arn:
#   AWS Console → Bedrock → Knowledge bases → brunny-aws → scroll to
#   "Service role" → copy the ARN
#
# collection_arn:
#   AWS Console → OpenSearch → Serverless → Collections → find the collection
#   created by the quick-start wizard → copy the ARN
# ---------------------------------------------------------------------------

resource "aws_bedrockagent_knowledge_base" "resume_kb" {
  name     = "brunny-aws"
  role_arn = "REPLACE_WITH_KB_IAM_ROLE_ARN"

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v2:0"
    }
  }

  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = "REPLACE_WITH_OPENSEARCH_COLLECTION_ARN"
      vector_index_name = "bedrock-knowledge-base-default-index"
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }
}

# ---------------------------------------------------------------------------
# Data Source — points the knowledge base at your S3 bucket
# ---------------------------------------------------------------------------

resource "aws_bedrockagent_data_source" "docs" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.resume_kb.id
  name              = "knowledge-base-quick-start-lnc07-data-source"

  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn = aws_s3_bucket.kb_documents.arn
    }
  }
}

# ---------------------------------------------------------------------------
# Output — used by chat.py to know which KB to query
# ---------------------------------------------------------------------------

output "knowledge_base_id" {
  value = aws_bedrockagent_knowledge_base.resume_kb.id
}
