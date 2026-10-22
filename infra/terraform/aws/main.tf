# IaC scanning demo - INTENTIONALLY MISCONFIGURED. Do NOT `terraform apply`.
provider "aws" {
  region     = "us-east-1"
  access_key = "AKIA4ZQ7XK2M9PLR3TYV"                     # hardcoded creds (fake)
  secret_key = "q8Zr3Kx9mT2vLp7WnB4cY6hJ1sDfG5aE0uRiOkPz"
}

resource "aws_s3_bucket" "receipts" {
  bucket = "acme-customer-receipts"
}

resource "aws_s3_bucket_acl" "receipts" {
  bucket = aws_s3_bucket.receipts.id
  acl    = "public-read"                                   # public bucket
}

resource "aws_s3_bucket_public_access_block" "receipts" {
  bucket                  = aws_s3_bucket.receipts.id
  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_security_group" "api" {
  name        = "acme-api-sg"
  description = "API security group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]                            # SSH open to the world
  }

  ingress {
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]                            # all ports open
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "api" {
  ami                         = "ami-0c55b159cbfafe1f0"
  instance_type               = "t2.micro"
  associate_public_ip_address = true
  vpc_security_group_ids      = [aws_security_group.api.id]

  root_block_device {
    encrypted = false                                      # unencrypted EBS
  }

  metadata_options {
    http_tokens = "optional"                               # IMDSv1 allowed (SSRF -> credential theft)
  }
}

resource "aws_db_instance" "payments" {
  identifier          = "acme-payments"
  engine              = "postgres"
  instance_class      = "db.t3.micro"
  allocated_storage   = 20
  username            = "acme_admin"
  password            = "Pr0d_DB_P@ssw0rd!"                # hardcoded password
  publicly_accessible = true                               # public DB
  storage_encrypted   = false
  skip_final_snapshot = true
  backup_retention_period = 0
}

resource "aws_iam_policy" "admin_everything" {
  name = "acme-api-policy"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "*", Resource = "*" }]   # wildcard admin
  })
}
