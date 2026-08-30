import zipfile
import xml.etree.ElementTree as ET
import sys
import io

# Ensure utf-8 output
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

try:
    docx = zipfile.ZipFile(r'd:\WemCut_Product_Backend_Business_Plan.docx')
    tree = ET.fromstring(docx.read('word/document.xml'))
    for node in tree.iterfind('.//w:t', {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}):
        if node.text:
            print(node.text)
except Exception as e:
    print(f"Error: {e}")
