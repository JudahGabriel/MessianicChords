using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MessianicChords.Api.Common;
using MessianicChords.Api.Services;
using MessianicChords.Models;
using MessianicChords.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Raven.Client.Documents;
using Raven.DependencyInjection;
using Raven.Migrations;
using Raven.StructuredLog;

namespace MessianicChords
{
    public class Startup
    {
        public const string AllowedCorsPolicy = "MessianicChordsOrigins";

        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            services.Configure<AppSettings>(Configuration.GetSection("AppSettings"));
            services.AddCors();
            services.AddControllers();

            services.AddRavenDbDocStore();
            services.AddRavenDbAsyncSession();
            services.AddRavenDbMigrations();
            services.AddRavenStructuredLogger();
            services.AddScoped<EmailService>();
            services.AddScoped<RavenSaveChangesFilter>();
            services.AddTransient<GoogleDriveChordsFetcher>();
            services.AddTransient<GoogleDriveSync>();
            services.AddTransient<GoogleDocPlainTextFetcher>();
            services.AddTransient<PdfToPng>();
            services.AddTransient<BunnyCdnManagerService>();
            services.AddTransient<ChordSubmissionService>();
            services.AddHostedService<GoogleDriveRavenSyncService>();
            services.AddHostedService<ThumbnailFetcher>();
            services.AddHostedService<ScreenshotGenerator>();
            services.AddHttpClient();

            services.AddControllersWithViews();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();

                // In dev mode, we load static files from /ClientApp/public
                app.UseStaticFiles(new StaticFileOptions
                {
                    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(
                        Path.Combine(env.ContentRootPath, "ClientApp/public")
                    )
                });
            }
            else
            {
                app.UseStaticFiles();
            }

            app.UseStaticFiles();
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
            var db = app.ApplicationServices.GetRequiredService<IDocumentStore>();
            Raven.Client.Documents.Indexes.IndexCreation.CreateIndexes(typeof(Startup).Assembly, db);

            // Run pending Raven migrations.
            var migrationService = app.ApplicationServices.GetRequiredService<MigrationRunner>();
            migrationService.Run();
        }
    }
}
