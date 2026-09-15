using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Text;
using TaskManager.Data;
using TaskManager.Models;
using TaskManager.Services;

DotNetEnv.Env.Load();

var builder = WebApplication.CreateBuilder(args);

var jwtSettings = new JwtSettings
{
    Secret = builder.Configuration["Jwt:Secret"] ?? "your-super-secret-key-change-this-in-production-at-least-32-chars",
    Issuer = builder.Configuration["Jwt:Issuer"] ?? "TaskManager",
    Audience = builder.Configuration["Jwt:Audience"] ?? "TaskManagerUsers",
    ExpirationMinutes = int.Parse(builder.Configuration["Jwt:ExpirationMinutes"] ?? "60")
};

builder.Services.AddSingleton(jwtSettings);
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordValidator, PasswordValidator>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Secret))
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.DefaultIgnoreCondition = 
            System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

