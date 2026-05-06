# ---------------------------------------------------------------------------
# Import commands — run these once to bring manually-created resources
# under Terraform management before running terraform apply:
#
#   terraform import aws_s3_bucket.kb_documents brunnyawsnotes
#   terraform import aws_bedrockagent_knowledge_base.resume_kb KNOWLEDGE_BASE_ID
#   terraform import aws_bedrockagent_data_source.docs KNOWLEDGE_BASE_ID/DATA_SOURCE_ID
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
  name        = "brunny-aws"
  description = "aws info from brunny"
  role_arn    = "arn:aws:iam::AWS_ACCOUNT_ID:role/service-role/AmazonBedrockExecutionRoleForKnowledgeBaseBrunnyAws"

  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
    }
  }

  # S3 Vectors storage — not yet supported by the Terraform AWS provider.
  # Managed manually in console. ignore_changes prevents Terraform from
  # wiping the config on apply.
  lifecycle {
    ignore_changes = [storage_configuration]
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
