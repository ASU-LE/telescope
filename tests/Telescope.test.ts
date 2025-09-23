import express from "express"
import Telescope from "../src/api/Telescope.js"
import RequestWatcher from "../src/api/watchers/RequestWatcher.js"
import ErrorWatcher from "../src/api/watchers/ErrorWatcher.js"
import {WatcherEntryCollectionType} from "../src"

describe('Telescope', () => {
    it('creates telescope instance', () => {
        const app = express()

        const telescope = Telescope.setup(app)

        expect(telescope).toBeInstanceOf(Telescope)
    })

    it('enables watchers', () => {
        const app = express()

        const telescope = Telescope.setup(app, {
            enabledWatchers: [
                RequestWatcher,
                ErrorWatcher
            ]
        })

        expect(
            Telescope.getEnabledWatchers()
        ).toEqual([
            WatcherEntryCollectionType.request,
            WatcherEntryCollectionType.exception
        ])

        expect(telescope).toBeInstanceOf(Telescope)
    })
})