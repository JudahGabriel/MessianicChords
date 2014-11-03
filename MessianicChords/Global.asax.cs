using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using MessianicChords.Models;
using MessianicChords.Common;
using System.Web.Caching;

namespace MessianicChords
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Home", action = "Index", id = UrlParameter.Optional } // Parameter defaults
            );
        }

        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);
            RavenStore.Initialize();

            AddTask("SyncChords", 10);
        }

        private void AddTask(string name, int seconds)
        {
            HttpRuntime.Cache.Insert(name, seconds, null,
                DateTime.Now.AddSeconds(seconds), Cache.NoSlidingExpiration,
                CacheItemPriority.NotRemovable, CacheItemRemoved);
        }

        private void CacheItemRemoved(string taskName, object value, CacheItemRemovedReason r)
        {
            if (taskName == "SyncChords")
            {
                new GoogleDriveSync()
                    .StartSync()
                    .ContinueWith(_ => AddTask(taskName, (int)TimeSpan.FromHours(1).TotalSeconds));
            }
        }
    }
}