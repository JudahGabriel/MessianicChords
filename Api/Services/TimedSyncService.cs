using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace MessianicChords.Services
{
    public class TimedSyncService : IHostedService, IDisposable
    {
        private readonly ILogger<TimedSyncService> logger;
        private readonly GoogleDriveSync driveSync;
        private readonly GoogleDocPlainTextFetcher plainTextFetcher;
        private Timer? timer;

        private static readonly TimeSpan syncTime = TimeSpan.FromHours(12);

        public TimedSyncService(
            GoogleDriveSync driveSync, 
            GoogleDocPlainTextFetcher plainTextFetcher,
            ILogger<TimedSyncService> logger)
        {
            this.driveSync = driveSync;
            this.plainTextFetcher = plainTextFetcher;
            this.logger = logger;
        }

        public Task StartAsync(CancellationToken stoppingToken)
        {
            timer = new Timer(async _ => await SyncGDocs(), null, TimeSpan.FromSeconds(5), syncTime);
            return Task.CompletedTask;
        }

        public Task StopAsync(CancellationToken stoppingToken)
        {
            logger.LogInformation("Timed Hosted Service is stopping.");

            timer?.Change(Timeout.Infinite, 0);

            return Task.CompletedTask;
        }

        public void Dispose()
        {
            timer?.Dispose();
            GC.SuppressFinalize(this);
        }

        private async Task SyncGDocs()
        {
            await driveSync.Start();
            await plainTextFetcher.Start();
            //return Task.CompletedTask;
        }
    }
}
