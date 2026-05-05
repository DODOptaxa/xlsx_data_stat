using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var dataPath = Path.Combine(Directory.GetCurrentDirectory(), "data.json");
var jsonText = await File.ReadAllTextAsync(dataPath);
var allRecords = JsonSerializer.Deserialize<List<EconomicRecord>>(jsonText,
    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new();

builder.Services.AddSingleton(allRecords);

var app = builder.Build();
app.UseCors();

app.MapGet("/api/summary", (List<EconomicRecord> records) =>
    Results.Ok(records.Where(r => r.Kved == "TOTAL").OrderBy(r => r.Year)));

app.MapGet("/api/sections", (List<EconomicRecord> records) =>
{
    var sections = records
        .Where(r => r.Kved.Length == 1)
        .GroupBy(r => new { r.Kved, r.Name_ua, r.Name_en })
        .Select(g => new {
            kved = g.Key.Kved, name_ua = g.Key.Name_ua, name_en = g.Key.Name_en,
            years = g.OrderBy(r => r.Year).ToList()
        })
        .OrderBy(s => s.kved);
    return Results.Ok(sections);
});

app.MapGet("/api/kved/{code}", (string code, List<EconomicRecord> records) =>
{
    var data = records.Where(r => r.Kved.Equals(code, StringComparison.OrdinalIgnoreCase)).OrderBy(r => r.Year).ToList();
    if (!data.Any()) return Results.NotFound();
    return Results.Ok(new { kved = code, name_ua = data[0].Name_ua, name_en = data[0].Name_en, years = data });
});

app.MapGet("/api/top", (int? year, int? limit, List<EconomicRecord> records) =>
{
    var yr = year ?? 2023; var lim = limit ?? 10;
    var top = records
        .Where(r => r.Year == yr && r.Kved.Length == 1 && r.Total.HasValue)
        .OrderByDescending(r => r.Total).Take(lim);
    return Results.Ok(top);
});

app.MapGet("/api/search", (string? q, List<EconomicRecord> records) =>
{
    if (string.IsNullOrWhiteSpace(q)) return Results.Ok(Array.Empty<object>());
    var lower = q.ToLower();
    var results = records
        .Where(r => r.Name_ua.ToLower().Contains(lower) || r.Name_en.ToLower().Contains(lower))
        .GroupBy(r => new { r.Kved, r.Name_ua, r.Name_en })
        .Select(g => new { g.Key.Kved, g.Key.Name_ua, g.Key.Name_en })
        .Take(20);
    return Results.Ok(results);
});

app.Run();

public class EconomicRecord
{
    public string Kved { get; set; } = "";
    public string Name_ua { get; set; } = "";
    public string Name_en { get; set; } = "";
    public int Year { get; set; }
    public double? Total { get; set; }
    public double? Large_thsd { get; set; }
    public double? Large_pct { get; set; }
    public double? Medium_thsd { get; set; }
    public double? Medium_pct { get; set; }
    public double? Small_thsd { get; set; }
    public double? Small_pct { get; set; }
    public double? Micro_thsd { get; set; }
    public double? Micro_pct { get; set; }
    public double? Ie_total { get; set; }
    public double? Ie_medium_thsd { get; set; }
    public double? Ie_medium_pct { get; set; }
    public double? Ie_small_thsd { get; set; }
    public double? Ie_small_pct { get; set; }
    public double? Ie_micro_thsd { get; set; }
    public double? Ie_micro_pct { get; set; }
}
