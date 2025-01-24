namespace MessianicChords.Services;

/// <summary>
/// Services that kicks off Google Drive sync services that add new GDrive docs to the 
/// database, removes deleted GDocs from the database, updates GDocs in the database, 
/// and fetches any plain text content for GDocs and updates the corresponding docs in Raven.
/// </summary>
public class GoogleDriveRavenSyncService : IHostedService, IDisposable
{
    private readonly ILogger<GoogleDriveRavenSyncService> logger;
    private readonly GoogleDriveSync driveSync;
    private readonly GoogleDocPlainTextFetcher plainTextFetcher;
    private Timer? timer;

    private static readonly TimeSpan syncTime = TimeSpan.FromHours(12);

    public GoogleDriveRavenSyncService(
        GoogleDriveSync driveSync, 
        GoogleDocPlainTextFetcher plainTextFetcher,
        ILogger<GoogleDriveRavenSyncService> logger)
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
    }
}
