import axios, {AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse, AxiosResponseHeaders, Method} from 'axios'
import DB from "../DB.js"
import WatcherEntry, {WatcherEntryCollectionType, WatcherEntryDataType} from "../WatcherEntry.js"
import {hostname} from "os"
import Telescope from "../Telescope.js"

export interface ClientRequestWatcherData
{
    hostname: string
    method: Method | string
    duration: number | null
    uri: string
    headers: Partial<AxiosRequestHeaders> | Object
    payload: object
    response_status: number
    response_headers: Partial<AxiosResponseHeaders> | Object
    response: any
}

export class ClientRequestWatcherEntry extends WatcherEntry<ClientRequestWatcherData>
{
    constructor(data: ClientRequestWatcherData, batchId?: string)
    {
        super(WatcherEntryDataType.clientRequests, data, batchId)
    }
}

export default class ClientRequestWatcher
{
    public static entryType = WatcherEntryCollectionType.clientRequest
    public static ignoreUrls: string[] = []

    private batchId?: string
    private request: AxiosRequestConfig
    private response: AxiosResponse

    constructor(request: AxiosRequestConfig, response: AxiosResponse, batchId?: string)
    {
        this.batchId = batchId
        this.request = request
        this.response = response
    }

    public static capture(telescope: Telescope)
    {
        let request: AxiosRequestConfig | null = null

        axios.interceptors.request.use((config) => {
            request = config
            if (telescope.batchId) {
                config.headers['X-Telescope-Batch-Id'] = telescope.batchId
            }
            config.headers['X-Telescope-Request-Start'] = new Date().toISOString()

            return config
        })

        axios.interceptors.response.use(async (response) => {
            if (request) {
                const watcher = new ClientRequestWatcher(request, response, telescope.batchId)

                !watcher.shouldIgnore() && await watcher.save()

                request = null
            }

            return response
        }, async (error: any) => {
            if (request) {
                const watcher = new ClientRequestWatcher(request, error.response, telescope.batchId)

                !watcher.shouldIgnore() && await watcher.save()

                request = null
            }

            return Promise.reject(error)
        })
    }

    public async save()
    {
        const headers = this.request.headers as AxiosRequestHeaders
        let duration: number | null = Date.now() - new Date(headers['X-Telescope-Request-Start'] as string).getTime();
        if (duration < 0) {
            duration = null; // If the duration is negative, set it to null
        }

        const entry = new ClientRequestWatcherEntry({
            hostname: hostname(),
            method: this.request.method?.toUpperCase() ?? '',
            duration: duration,
            uri: this.request.url ?? '',
            headers: this.request.headers ?? {},
            payload: this.request.data ?? {},
            response_status: this.response.status,
            response_headers: this.response.headers,
            response: this.isHtmlResponse() ? this.escapeHTML(this.response.data) : this.response.data
        }, this.batchId)

        await DB.clientRequests().save(entry)
    }

    private escapeHTML(html: string)
    {
        return html.replace(
            /[&<>'"]/g,
            tag =>
                ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag] || tag)
        )
    }

    private isHtmlResponse(): boolean
    {
        return (this.response?.headers ?? [])['content-type']?.startsWith('text/html') ?? false
    }

    private shouldIgnore(): boolean
    {
        const checks = ClientRequestWatcher.ignoreUrls.map((url) => {
            return url.endsWith('*') ? this.request.url?.startsWith(url.slice(0, -1)) : this.request.url === url
        })

        return checks.includes(true)
    }
}