from django import forms
from django.utils.safestring import mark_safe
from django.conf import settings
from django.core.files.base import ContentFile
import base64
import json
import os


class ClipboardImageWidget(forms.ClearableFileInput):
    """
    Custom widget that allows pasting images from clipboard in addition to file upload
    """
    
    def __init__(self, attrs=None):
        default_attrs = {'accept': 'image/*'}
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def value_from_datadict(self, data, files, name):
        """
        Override to handle both regular file uploads and base64 clipboard data
        """
        print(f"🔍 ClipboardImageWidget.value_from_datadict called for field '{name}'")
        print(f"📁 Files keys: {list(files.keys())}")
        print(f"📝 Data keys: {[k for k in data.keys() if name in k]}")
        
        # First try regular file upload
        upload = super().value_from_datadict(data, files, name)
        if upload:
            print(f"✅ Regular file upload found: {upload}")
            return upload
            
        # Then try base64 fallback
        base64_data = data.get(f'{name}_base64')
        file_info = data.get(f'{name}_info')
        
        print(f"🔍 Base64 data present: {bool(base64_data)}")
        print(f"🔍 File info present: {bool(file_info)}")
        
        if base64_data and file_info:
            try:
                print("🎯 Processing base64 clipboard data...")
                # Parse file info
                info = json.loads(file_info)
                print(f"📋 File info: {info}")
                
                # Decode base64 data
                format, imgstr = base64_data.split(';base64,')
                ext = format.split('/')[-1]
                
                # Create ContentFile from base64 data
                file_data = base64.b64decode(imgstr)
                filename = info.get('name', f'pasted-image.{ext}')
                
                content_file = ContentFile(file_data, name=filename)
                print(f"✅ Created ContentFile: {filename} ({len(file_data)} bytes)")
                return content_file
            except (ValueError, json.JSONDecodeError, KeyError) as e:
                print(f"❌ Error processing base64 data: {e}")
                pass
                
        print("❌ No file data found")
        return None

    def render(self, name, value, attrs=None, renderer=None):
        # Get the original file input HTML
        original_html = super().render(name, value, attrs, renderer)
        
        # Add our custom clipboard functionality
        widget_id = attrs.get('id', f'id_{name}') if attrs else f'id_{name}'
        
        custom_html = f'''
        <div class="clipboard-image-widget">
            <div class="clipboard-upload-area" id="clipboard-area-{widget_id}">
                <div class="clipboard-drop-zone">
                    <p><strong>📋 Paste from clipboard:</strong> Ctrl+V (Cmd+V on Mac)</p>
                    <p><strong>📁 Or use file upload below</strong></p>
                    <div class="clipboard-preview" id="preview-{widget_id}" style="display: none;">
                        <img id="preview-img-{widget_id}" style="max-width: 200px; max-height: 200px; border: 1px solid #ddd; margin: 10px 0;">
                        <br>
                        <button type="button" id="clear-clipboard-{widget_id}" class="button">Clear pasted image</button>
                    </div>
                </div>
            </div>
            {original_html}
        </div>
        
        <style>
            .clipboard-image-widget {{
                border: 1px solid #ddd;
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                background: #f9f9f9;
            }}
            
            .clipboard-drop-zone {{
                border: 2px dashed #ccc;
                padding: 20px;
                text-align: center;
                border-radius: 4px;
                background: #fff;
                margin-bottom: 15px;
                transition: border-color 0.3s ease;
            }}
            
            .clipboard-drop-zone:hover,
            .clipboard-drop-zone.dragover {{
                border-color: #007cba;
                background: #f0f8ff;
            }}
            
            .clipboard-preview img {{
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }}
        </style>
        
        <script>
        (function() {{
            const clipboardArea = document.getElementById('clipboard-area-{widget_id}');
            const fileInput = document.getElementById('{widget_id}');
            const preview = document.getElementById('preview-{widget_id}');
            const previewImg = document.getElementById('preview-img-{widget_id}');
            const clearBtn = document.getElementById('clear-clipboard-{widget_id}');
            const dropZone = clipboardArea.querySelector('.clipboard-drop-zone');
            
            let pastedFile = null;
            
            // Clipboard paste functionality
            document.addEventListener('paste', function(e) {{
                if (!clipboardArea.contains(document.activeElement) && 
                    !clipboardArea.matches(':hover')) {{
                    return;
                }}
                
                const items = e.clipboardData.items;
                for (let i = 0; i < items.length; i++) {{
                    const item = items[i];
                    if (item.type.indexOf('image') !== -1) {{
                        e.preventDefault();
                        const file = item.getAsFile();
                        handlePastedImage(file);
                        break;
                    }}
                }}
            }});
            
            // Drag and drop functionality
            dropZone.addEventListener('dragover', function(e) {{
                e.preventDefault();
                dropZone.classList.add('dragover');
            }});
            
            dropZone.addEventListener('dragleave', function(e) {{
                e.preventDefault();
                dropZone.classList.remove('dragover');
            }});
            
            dropZone.addEventListener('drop', function(e) {{
                e.preventDefault();
                dropZone.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0 && files[0].type.indexOf('image') !== -1) {{
                    handlePastedImage(files[0]);
                }}
            }});
            
            // Make the clipboard area focusable
            clipboardArea.setAttribute('tabindex', '0');
            clipboardArea.addEventListener('click', function() {{
                clipboardArea.focus();
            }});
            
            function handlePastedImage(file) {{
                pastedFile = file;
                
                // Create a new File object with a proper name
                const timestamp = new Date().getTime();
                const extension = file.type.split('/')[1] || 'png';
                const namedFile = new File([file], `pasted-image-${{timestamp}}.${{extension}}`, {{
                    type: file.type
                }});
                
                try {{
                    // Try to update the file input - this works in most modern browsers
                    const dt = new DataTransfer();
                    dt.items.add(namedFile);
                    fileInput.files = dt.files;
                    
                    // Show preview
                    const reader = new FileReader();
                    reader.onload = function(e) {{
                        previewImg.src = e.target.result;
                        preview.style.display = 'block';
                    }};
                    reader.readAsDataURL(file);
                    
                    // Trigger change event on file input
                    const event = new Event('change', {{ bubbles: true }});
                    fileInput.dispatchEvent(event);
                    
                    console.log('✅ File successfully set on input:', namedFile.name);
                }} catch (error) {{
                    console.warn('⚠️ Could not set file on input (browser security restriction):', error);
                    
                    // Fallback: Show preview but create a hidden input to hold the file data
                    const reader = new FileReader();
                    reader.onload = function(e) {{
                        previewImg.src = e.target.result;
                        preview.style.display = 'block';
                        
                        // Create hidden field with base64 data as fallback
                        let hiddenInput = document.getElementById('hidden-file-{widget_id}');
                        if (!hiddenInput) {{
                            hiddenInput = document.createElement('input');
                            hiddenInput.type = 'hidden';
                            hiddenInput.id = 'hidden-file-{widget_id}';
                            hiddenInput.name = '{name}_base64';
                            fileInput.parentNode.insertBefore(hiddenInput, fileInput.nextSibling);
                        }}
                        hiddenInput.value = e.target.result;
                        
                        // Store file info for form submission
                        let fileInfoInput = document.getElementById('file-info-{widget_id}');
                        if (!fileInfoInput) {{
                            fileInfoInput = document.createElement('input');
                            fileInfoInput.type = 'hidden';
                            fileInfoInput.id = 'file-info-{widget_id}';
                            fileInfoInput.name = '{name}_info';
                            fileInput.parentNode.insertBefore(fileInfoInput, fileInput.nextSibling);
                        }}
                        fileInfoInput.value = JSON.stringify({{
                            name: namedFile.name,
                            type: namedFile.type,
                            size: namedFile.size
                        }});
                        
                        console.log('📋 Created hidden inputs:', {{
                            base64Name: '{name}_base64',
                            infoName: '{name}_info',
                            fileName: namedFile.name,
                            fileSize: namedFile.size
                        }});
                    }};
                    reader.readAsDataURL(file);
                }}
            }}
            
            // Clear functionality
            clearBtn.addEventListener('click', function() {{
                pastedFile = null;
                fileInput.value = '';
                preview.style.display = 'none';
                
                // Remove hidden inputs if they exist
                const hiddenInput = document.getElementById('hidden-file-{widget_id}');
                const fileInfoInput = document.getElementById('file-info-{widget_id}');
                if (hiddenInput) hiddenInput.remove();
                if (fileInfoInput) fileInfoInput.remove();
                
                // Trigger change event
                const event = new Event('change', {{ bubbles: true }});
                fileInput.dispatchEvent(event);
            }});
            
            // Handle file input changes (for regular file uploads)
            fileInput.addEventListener('change', function() {{
                if (this.files.length > 0 && !pastedFile) {{
                    const file = this.files[0];
                    const reader = new FileReader();
                    reader.onload = function(e) {{
                        previewImg.src = e.target.result;
                        preview.style.display = 'block';
                    }};
                    reader.readAsDataURL(file);
                }} else if (this.files.length === 0) {{
                    preview.style.display = 'none';
                }}
            }});
            
        }})();
        </script>
        '''
        
        return mark_safe(custom_html)

    class Media:
        css = {
            'all': ()
        }
        js = ()
