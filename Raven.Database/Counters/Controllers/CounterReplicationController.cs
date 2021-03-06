﻿using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web;
using System.Web.Http;

namespace Raven.Database.Counters.Controllers
{
    public class CounterReplicationController : RavenCountersApiController
    {
        [Route("counters/{counterName}/replication")]
        public HttpResponseMessage Post(ReplicationMessage replicationMessage)
        {
            /*Read Current Counter Value for CounterName - Need ReaderWriter Lock
             *If values are ABS larger
             *      Write delta
             *Store last ETag for servers we've successfully rpelicated to
             */
	        long lastEtag = 0;
            bool wroteCounter = false;
            using (var writer = Storage.CreateWriter())
            {
	            foreach (var counter in replicationMessage.Counters)
	            {
		            lastEtag = Math.Max(counter.Etag, lastEtag);
		            var currentCounter = writer.GetCounter(counter.CounterName);
		            foreach (var serverValue in counter.ServerValues)
		            {
			            var currentServerValue = currentCounter.ServerValues
				            .FirstOrDefault(x => x.SourceId == Storage.SourceIdFor(serverValue.ServerName)) ??
			                                     new Counter.PerServerValue
			                                     {
				                                     Negative = 0,
				                                     Positive = 0,
			                                     };

			            if (serverValue.Positive == currentServerValue.Positive &&
			                serverValue.Negative == currentServerValue.Negative)
				            continue;

		                wroteCounter = true;
			            writer.Store(replicationMessage.SendingServerName,
				            counter.CounterName,
				            Math.Max(serverValue.Positive, currentServerValue.Positive),
				            Math.Max(serverValue.Negative, currentServerValue.Negative)
				            );
		            }
	            }

                if (wroteCounter)
                {
                    writer.RecordLastEtagFor(replicationMessage.SendingServerName, lastEtag);
                    writer.Commit(); 
                }
	            return new HttpResponseMessage(HttpStatusCode.OK);
            }
        }

        [Route("counters/{counterName}/lastEtag/{server}")]
        public HttpResponseMessage GetLastEtag(string server)
        {
			//HACK: nned a wire firendly name or fix Owin impl to allow url on query string or just send back all etags
            server = Storage.Name.Replace(RavenCounterReplication.GetServerNameForWire(Storage.Name), server);
            var sourceId = Storage.SourceIdFor(server);
            using (var reader = Storage.CreateReader())
            {
                var result = reader.GetServerEtags().FirstOrDefault(x => x.SourceId == sourceId) ?? new CounterStorage.ServerEtag();
                return Request.CreateResponse(HttpStatusCode.OK, result.Etag);
            }
        }
    }
}