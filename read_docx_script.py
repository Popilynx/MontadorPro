import zipfile
import xml.etree.ElementTree as ET
import sys

def read_docx(path):
    try:
        doc = zipfile.ZipFile(path)
        xml_content = doc.read('word/document.xml')
        doc.close()
        
        tree = ET.fromstring(xml_content)
        namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        text = []
        for paragraph in tree.findall('.//w:p', namespaces):
            para_text = []
            for run in paragraph.findall('.//w:r', namespaces):
                for text_node in run.findall('.//w:t', namespaces):
                    if text_node.text:
                        para_text.append(text_node.text)
            if para_text:
                text.append(''.join(para_text))
            else:
                text.append('')
        return '\n'.join(text)
    except Exception as e:
        return f"Error reading docx: {e}"

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = read_docx(sys.argv[1])
        with open('doc_text.txt', 'w', encoding='utf-8') as f:
            f.write(text)
