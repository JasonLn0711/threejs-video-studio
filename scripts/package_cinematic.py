"""Project-scoped editable package with clean-install/native-seek restore proof."""
import argparse,json,hashlib,zipfile,tempfile,subprocess,os
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def main():
 a=argparse.ArgumentParser();a.add_argument('--project',required=True);a.add_argument('--output',required=True);a.add_argument('--proof',action='store_true');x=a.parse_args();project=Path(x.project).resolve();output=Path(x.output).resolve();f=json.loads((project/'film.json').read_text());receipt=json.loads((output/('proof-receipt.json' if x.proof else 'render-receipt.json')).read_text())
 if receipt['status']!='passed':raise RuntimeError('A passed render receipt is required')
 movie=output/('proof-10s.mp4' if x.proof else f['id']+'.mp4')
 if sha(movie)!=receipt['sha256']:raise RuntimeError('Delivery changed after verification')
 files=[];exclude={'.cache','.media','.hyperframes','dist','node_modules','__pycache__'}
 for base in [ROOT/'scripts',ROOT/'src',ROOT/'tests',project]:
  for parent,dirs,names in os.walk(base):
   for d in dirs:
    if (Path(parent)/d).is_symlink():raise RuntimeError('Symlink in package')
   dirs[:]=[d for d in dirs if d not in exclude]
   for name in names:
    p=Path(parent)/name
    if p.is_symlink():raise RuntimeError('Symlink in package')
    if not name.endswith('.log'):files.append(p)
 for name in ['package.json','package-lock.json','tsconfig.json','requirements-audio.txt','LICENSE','THREEJS_VIDEO_PRODUCTION_STANDARD_v1.0.md']:
  files.append(ROOT/name)
 for name in ['film.json','captions.json']:files.append(ROOT/'examples/ddos-capacity'/name)
 manifest={str(p.relative_to(ROOT)):{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(set(files))}
 stem=f['id']+('-proof' if x.proof else '')+'-editable';temp=output/(stem+'.tmp.zip');final=output/(stem+'.zip')
 with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
  for rel in manifest:z.write(ROOT/rel,rel)
  z.writestr('ARCHIVE_MANIFEST.json',json.dumps(manifest,indent=2)+'\n')
  z.writestr('README.md',(project/'README.md').read_text())
 with tempfile.TemporaryDirectory(prefix='signature-restore-') as folder:
  with zipfile.ZipFile(temp) as z:
   if z.testzip():raise RuntimeError('ZIP CRC failed')
   z.extractall(folder)
  for rel,m in manifest.items():
   if sha(Path(folder)/rel)!=m['sha256']:raise RuntimeError('Extracted hash mismatch')
  golden=ROOT/receipt['gate']['run']/('proof-browser' if x.proof else 'film-browser')/'report.json'
  subprocess.run(['node',str(ROOT/'scripts/cinematic-restore.mjs'),folder,str(project.relative_to(ROOT)),str(golden),str(output/'restore-receipt.json'),'proof' if x.proof else 'film'],check=True)
 for rel,m in manifest.items():
  if sha(ROOT/rel)!=m['sha256']:raise RuntimeError('Source changed while packaging')
 os.replace(temp,final)
 r={'status':'passed','zip':final.name,'zipSha256':sha(final),'files':len(manifest),'crc':'passed','extractedHashes':'passed','restoreReceiptSha256':sha(output/'restore-receipt.json'),'videoSha256':sha(movie),'scope':'Proof-stage editable source; full film encode awaits human approval' if x.proof else 'Full film editable source'}
 (output/'package-receipt.json').write_text(json.dumps(r,indent=2)+'\n');print(json.dumps(r))
if __name__=='__main__':main()
