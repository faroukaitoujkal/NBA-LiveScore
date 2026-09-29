namespace NBA_LiveScore.Server.DTOs
{
    public class PlayerDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Number { get; set; }
        public string? Position { get; set; }
        public double? Height { get; set; }
        public double? Weight { get; set; }
        public string? ImageUrl { get; set; }
        public int TeamId { get; set; }
        public TeamDto? Team { get; set; }
    }
}
