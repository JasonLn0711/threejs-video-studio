import unittest,tempfile,json,wave,hashlib,sys
from pathlib import Path
from array import array
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from verify_cinematic import verify

class CinematicAudio(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.p=Path(self.temp.name);self.a=self.p/'assets/audio';self.a.mkdir(parents=True)
  self.f={'id':'test','profile':'cinematic-short-v1','duration':3,'frameCount':90};self.c=[{'id':'one','startSample':4800,'endSample':52800,'start':.1,'end':1.1,'gapBefore':.35}]
  self.dry=array('h',[0]*9600+[1000]*96000+[0]*(288000-105600))
  self.write(self.a/'one.wav',array('h',[1000]*96000));self.save(self.dry)
 def tearDown(self):self.temp.cleanup()
 def write(self,p,data):
  with wave.open(str(p),'wb') as w:w.setparams((2,2,48000,0,'NONE','not compressed'));w.writeframes(data.tobytes())
 def save(self,mix):
  (self.p/'film.json').write_text(json.dumps(self.f));(self.p/'captions.json').write_text(json.dumps(self.c));self.write(self.a/'narration.wav',self.dry);self.write(self.a/'mix.wav',mix)
  (self.a/'mix-receipt.json').write_text(json.dumps({'mixSha256':hashlib.sha256((self.a/'mix.wav').read_bytes()).hexdigest(),'intentionalSilences':[]}))
 def test_valid_bounded_voice(self):
  with patch('verify_cinematic.measure',return_value={'input_i':'-14','input_tp':'-2'}):self.assertEqual(verify(self.p)['status'],'passed')
 def test_dropped_voice_rejected(self):
  self.dry[10000]=0;self.save(self.dry)
  with self.assertRaisesRegex(ValueError,'Voice differs'):verify(self.p)
 def test_long_tail_rejected_even_with_music(self):
  self.f.update(duration=4,frameCount=120);self.dry.extend([0]*96000);self.save(array('h',[1000]*384000))
  with self.assertRaisesRegex(ValueError,'Excessive final hold'):verify(self.p)
 def test_mix_dropout_rejected_independently(self):
  mix=array('h',self.dry);mix[:60000]=array('h',[0]*60000);self.save(mix)
  with patch('verify_cinematic.measure',return_value={'input_i':'-14','input_tp':'-2'}):
   with self.assertRaisesRegex(ValueError,'Unexpected mixed-track silent interval'):verify(self.p)

if __name__=='__main__':unittest.main()
