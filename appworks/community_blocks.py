"""Strict ordered plain-text/media references; never HTML."""
import json


def parse(raw, body, retained, new, remove=''):
    current={a['id']:a for a in retained}
    removed=set(remove.split(',')) if remove else set()
    if not removed <= {str(i) for i in current}:
        raise ValueError('ไฟล์ที่ลบไม่ได้อยู่ในโพสต์นี้')
    available={i:a for i,a in current.items() if str(i) not in removed}
    if raw is None or raw == '':
        blocks=[{'type':'text','text':body}]
        blocks += [{'type':'attachment','id':i} for i in available]
        blocks += [{'type':'attachment','upload':i} for i in range(len(new))]
    else:
        try:
            blocks=json.loads(raw)
        except (ValueError,TypeError,RecursionError):
            raise ValueError('เนื้อหาไม่ถูกต้อง') from None
    if not isinstance(blocks,list) or not 1<=len(blocks)<=64:
        raise ValueError('เนื้อหาต้องมี 1–64 บล็อก')
    seen=set(); texts=[]; image=False
    for b in blocks:
        if not isinstance(b,dict):
            raise ValueError('บล็อกไม่ถูกต้อง')
        if b.get('type')=='text' and set(b)=={'type','text'}:
            text=b['text']
            if not isinstance(text,str) or any((ord(c)<32 and c not in '\n\r\t') or 0xD800<=ord(c)<=0xDFFF for c in text):
                raise ValueError('ข้อความไม่ถูกต้อง')
            texts.append(text)
        elif b.get('type')=='attachment' and set(b) in ({'type','id'},{'type','upload'}):
            key='id' if 'id' in b else 'upload'; n=b[key]
            if type(n) is not int or (key,n) in seen:
                raise ValueError('ไฟล์อ้างอิงไม่ถูกต้องหรือซ้ำ')
            if key=='id':
                f=available.get(n)
            else:
                f=new[n] if 0<=n<len(new) else None
            if f is None:
                raise ValueError('ไฟล์ไม่ได้อยู่ในโพสต์นี้')
            seen.add((key,n));image=image or f['mime'].startswith('image/')
        else:
            raise ValueError('ชนิดบล็อกไม่ถูกต้อง')
    if seen != {('id',i) for i in available}|{('upload',i) for i in range(len(new))}:
        raise ValueError('กรุณาระบุตำแหน่งทุกไฟล์')
    # Join without adding characters: the exact text block values are authoritative.
    body=''.join(texts)
    if len(body)>2000 or (not body.strip() and not image):
        raise ValueError('กรอกข้อความไม่เกิน 2,000 ตัวอักษร หรือแนบภาพ')
    return blocks,body


def save(db,pid,blocks,new_ids):
    saved=[{'type':'attachment','id':new_ids[b['upload']]} if 'upload' in b else b for b in blocks]
    db.execute('UPDATE community_posts SET content_blocks=? WHERE id=?',(json.dumps(saved,ensure_ascii=False),pid))


def draft(raw, attachments):
    """Keep safe text/retained order on errors; local uploads must be reselected."""
    try:
        data=json.loads(raw)
        if not isinstance(data,list) or len(data)>64:
            return None
        data=[b for b in data if not (isinstance(b,dict) and set(b)=={'type','upload'} and b.get('type')=='attachment')]
        retained_ids={b['id'] for b in data if isinstance(b,dict) and set(b)=={'type','id'} and type(b['id']) is int}
        remaining=[a for a in attachments if a['id'] in retained_ids]
        clean,_=parse(json.dumps(data),'',remaining,[])
        return json.dumps(clean,ensure_ascii=False)
    except (ValueError,TypeError,RecursionError):
        return None


def display(raw,attachments):
    if not raw:
        return None
    try:
        blocks,_=parse(raw,'',attachments,[])
        files={a['id']:a for a in attachments}
        return [dict(b,file=files[b['id']]) if b['type']=='attachment' else b for b in blocks]
    except (ValueError,KeyError,TypeError):
        return None
