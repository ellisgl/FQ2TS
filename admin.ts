#!/usr/bin/env bun
// Final Quest 2's server admin:  bun run admin COMMAND [NAME] [REASON...]  (-h for them)

import { runAdmin } from '@fq2js/server/admin-cli';

process.exit(runAdmin({ database: 'fq2.sqlite' }));
