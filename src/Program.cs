using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Api.Common;
using MessianicChords.Api.Services;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.DependencyInjection;
using Raven.Migrations;
using Raven.StructuredLogger;

namespace MessianicChords
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateWebApplication(args).Run();
            //CreateHostBuilder(args).Build().Run();
        }

        public static WebApplication CreateWebApplication(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));
            builder.Services.AddCors();
            builder.Services.AddControllers();
            builder.Services.AddControllersWithViews();

            builder.Services.AddRavenDbDocStore();
            builder.Services.AddRavenDbAsyncSession();
            builder.Services.AddRavenDbMigrations();
            builder.Services.AddRavenStructuredLogger();
            builder.Services.AddScoped<EmailService>();
            builder.Services.AddScoped<RavenSaveChangesFilter>();
            builder.Services.AddTransient<GoogleDriveChordsFetcher>();
            builder.Services.AddTransient<GoogleDriveSync>();
            builder.Services.AddTransient<GoogleDocPlainTextFetcher>();
            builder.Services.AddTransient<PdfToPng>();
            builder.Services.AddTransient<BunnyCdnManagerService>();
            builder.Services.AddTransient<ChordSubmissionService>();
            builder.Services.AddHostedService<GoogleDriveRavenSyncService>();
            builder.Services.AddHostedService<ThumbnailFetcher>();
            builder.Services.AddHostedService<ScreenshotGenerator>();
            builder.Services.AddHttpClient();

            // Configure the HTTP request pipeline.
            var app = builder.Build();
            app.UseHttpsRedirection();
            app.UseAuthorization();
            app.MapControllers();
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();

                // In dev mode, we load static files from /ClientApp/public
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
                        Path.Combine(app.Environment.ContentRootPath, "ClientApp/public")
                    )
                });
            }
            else
            {
                app.UseStaticFiles();
            }

            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseCors(x => x
                .WithOrigins(
                    "http://localhost:8000", 
                    "http://localhost:3000",
                    "https://localhost:44365",
                    "http://localhost:7777",
                    "https://localhost:7777",
                    "https://messianicchords.com", 
                    "https://www.messianicchords.com"
                )
                .AllowAnyMethod()
                .AllowAnyHeader());
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });

            // Install RavenDB indexes
            var db = app.Services.GetRequiredService<IDocumentStore>();
            Raven.Client.Documents.Indexes.IndexCreation.CreateIndexes(typeof(Program).Assembly, db);

            // Run pending Raven migrations.
            var migrationService = app.Services.GetRequiredService<MigrationRunner>();
            migrationService.Run();

            return app;
        }

        // public static IHostBuilder CreateHostBuilder(string[] args) =>
        //     Host.CreateDefaultBuilder(args)
        //         .ConfigureWebHostDefaults(webBuilder =>
        //         {
        //             webBuilder.UseStartup<Startup>();
        //         });
    }
}
