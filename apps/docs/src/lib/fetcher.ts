import { Fetcher } from '@composite-fetcher/core'
import { SessionStorageDriver, withCaching } from '@composite-fetcher/with-caching'
import { withLogging } from '@composite-fetcher/with-logging'

const fetcher = new Fetcher()
fetcher.use(new withLogging())
fetcher.use(new withCaching({ cacheDriver: new SessionStorageDriver()}))

export default fetcher

