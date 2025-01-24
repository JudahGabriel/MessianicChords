namespace MessianicChords.Models;

public class PagedResults<T>
{
    public int Skip { get; init; }
    public int Take { get; init; }
    public List<T> Results { get; init; } = new List<T>();
    public long TotalCount { get; init; }
}
