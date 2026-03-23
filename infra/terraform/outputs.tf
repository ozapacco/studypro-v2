output "api_url" {
  value = "http://${aws_lb.studypro.dns_name}"
}

output "database_endpoint" {
  value     = aws_db_instance.studypro.endpoint
  sensitive = true
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.studypro.cache_nodes[0].endpoint.address
}

output "vpc_id" {
  value = aws_vpc.studypro.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.studypro.name
}

output "s3_bucket_name" {
  value = aws_s3_bucket.studypro_assets.bucket
}
