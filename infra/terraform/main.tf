terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "studypro" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "studypro-vpc"
    Environment = var.environment
  }
}

resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.studypro.id
  cidr_block        = cidrsubnet(aws_vpc.studypro.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "studypro-private-${count.index + 1}"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.studypro.id
  cidr_block        = cidrsubnet(aws_vpc.studypro.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = {
    Name = "studypro-public-${count.index + 1}"
  }
}

resource "aws_db_subnet_group" "studypro" {
  name       = "studypro-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  
  tags = {
    Name = "studypro-db-subnet-group"
  }
}

resource "aws_elasticache_subnet_group" "studypro" {
  name       = "studypro-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_ecs_cluster" "studypro" {
  name = "studypro-${var.environment}"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_db_instance" "studypro" {
  identifier     = "studypro-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  db_name  = "studypro"
  username = "postgres"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.studypro.name
  
  backup_retention_period = 7
  skip_final_snapshot     = var.environment != "production"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_elasticache_cluster" "studypro" {
  cluster_id           = "studypro-${var.environment}"
  engine               = "redis"
  engine_version       = "7.0"
  node_type            = var.cache_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  security_group_ids   = [aws_security_group.redis.id]
  subnet_group_name    = aws_elasticache_subnet_group.studypro.name
}

resource "aws_security_group" "api" {
  name        = "studypro-api"
  description = "Security group for StudyPro API"
  vpc_id      = aws_vpc.studypro.id
  
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name = "studypro-api-sg"
  }
}

resource "aws_security_group" "db" {
  name        = "studypro-db"
  description = "Security group for StudyPro RDS"
  vpc_id      = aws_vpc.studypro.id
  
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.studypro.cidr_block]
  }
  
  tags = {
    Name = "studypro-db-sg"
  }
}

resource "aws_security_group" "redis" {
  name        = "studypro-redis"
  description = "Security group for StudyPro ElastiCache"
  vpc_id      = aws_vpc.studypro.id
  
  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.studypro.cidr_block]
  }
  
  tags = {
    Name = "studypro-redis-sg"
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "studypro-ecs-task-execution"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_policy" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_s3_bucket" "studypro_assets" {
  bucket = "studypro-assets-${var.environment}"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_public_access_block" "studypro_assets" {
  bucket = aws_s3_bucket.studypro_assets.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_lb" "studypro" {
  name               = "studypro-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.api.id]
  subnets            = aws_subnet.public[*].id
}

resource "aws_lb_target_group" "api" {
  name     = "studypro-api-tg"
  port     = 3000
  protocol = "HTTP"
  vpc_id   = aws_vpc.studypro.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
}

resource "aws_lb_listener" "api" {
  load_balancer_arn = aws_lb.studypro.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }
}
