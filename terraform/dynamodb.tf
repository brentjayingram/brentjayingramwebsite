resource "aws_dynamodb_table" "visitor_tracking" {
  name           = "website-visitors"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "visitor_id"

  attribute {
    name = "visitor_id"
    type = "S"
  }

  tags = {
    Environment = "production"
    Purpose     = "visitor-tracking"
  }
}