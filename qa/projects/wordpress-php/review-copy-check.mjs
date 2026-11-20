import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {compareEncoded} from '../../../scripts/cinematic-encoded.mjs';
const root=process.cwd(),output=path.join(root,'output/wordpress-php');
const receipt=JSON.parse(await fs.readFile(path.join(output,'render-receipt.json'),'utf8'));
await compareEncoded(path.join(output,'wordpress-php-review.webm'),null,path.join(root,receipt.gate.run,'browser'),path.join(output,'review-copy-pixels'));
const result=spawnSync('python3',['qa/projects/wordpress-php/verify-review-copy.py'],{cwd:root,stdio:'inherit'});process.exitCode=result.status||0;
