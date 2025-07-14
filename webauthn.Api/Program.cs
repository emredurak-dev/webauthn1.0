using webauthn.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add session support
builder.Services.AddDistributedMemoryCache();
builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30);
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});

//cqrs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowWebAuthnSites", policy =>
    {
        policy.WithOrigins("https://webauthn.io", "https://webauthn.me")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register WebAuthn service
builder.Services.AddSingleton<WebAuthnService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseSession();
app.UseCors("AllowWebAuthnSites");
app.UseAuthorization();
app.MapControllers();

app.Run();
