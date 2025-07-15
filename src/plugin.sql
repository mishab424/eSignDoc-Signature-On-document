prompt --application/set_environment
set define off verify off feedback off
whenever sqlerror exit sql.sqlcode rollback
--------------------------------------------------------------------------------
--
-- Oracle APEX export file
--
-- You should run this script using a SQL client connected to the database as
-- the owner (parsing schema) of the application or as a database user with the
-- APEX_ADMINISTRATOR_ROLE role.
--
-- This export file has been automatically generated. Modifying this file is not
-- supported by Oracle and can lead to unexpected application and/or instance
-- behavior now or in the future.
--
-- NOTE: Calls to apex_application_install override the defaults below.
--
--------------------------------------------------------------------------------
begin
wwv_flow_imp.import_begin (
 p_version_yyyy_mm_dd=>'2024.11.30'
,p_release=>'24.2.6'
,p_default_workspace_id=>1000001
,p_default_application_id=>146
,p_default_id_offset=>0
,p_default_owner=>'WKSP_ASSENTADEV'
);
end;
/
 
prompt APPLICATION 146 - PLUGINS
--
-- Application Export:
--   Application:     146
--   Name:            PLUGINS
--   Date and Time:   06:06 Tuesday July 15, 2025
--   Exported By:     MISHAB
--   Flashback:       0
--   Export Type:     Component Export
--   Manifest
--     PLUGIN: 80542704965488011
--   Manifest End
--   Version:         24.2.6
--   Instance ID:     7828741953581541
--

begin
  -- replace components
  wwv_flow_imp.g_mode := 'REPLACE';
end;
/
prompt --application/shared_components/plugins/template_component/esigndoc_signature_on_document
begin
wwv_flow_imp_shared.create_plugin(
 p_id=>wwv_flow_imp.id(80542704965488011)
,p_plugin_type=>'TEMPLATE COMPONENT'
,p_theme_id=>nvl(wwv_flow_application_install.get_theme_id, '')
,p_name=>'ESIGNDOC_SIGNATURE_ON_DOCUMENT'
,p_display_name=>'eSignDoc-Signature-On-document'
,p_javascript_file_urls=>wwv_flow_string.join(wwv_flow_t_varchar2(
'<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>',
'<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>',
'<script src="https://cdnjs.cloudflare.com/ajax/libs/docx/8.0.1/docx.umd.min.js"></script>',
'',
'#APP_FILES#eSignDoc_script.js'))
,p_css_file_urls=>wwv_flow_string.join(wwv_flow_t_varchar2(
'#APP_FILES#eSignDoc_style.css',
'',
'',
'<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">',
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">'))
,p_partial_template=>wwv_flow_string.join(wwv_flow_t_varchar2(
'<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">',
'<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">',
'  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.min.js"></script>',
'  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>',
'  <script src="https://cdnjs.cloudflare.com/ajax/libs/docx/8.0.1/docx.umd.min.js"></script>',
'  ',
'{if APEX$IS_LAZY_LOADING/}',
'  <div></div>',
'{else/}',
'  <div class="container">',
'    <div class="header">',
'      <h1><i class="fas fa-signature"></i> PDF Signature Tool</h1>',
'    </div>',
'    ',
'    <div class="main-content">',
'      <div class="sidebar">',
'        <div class="section">',
'          <div class="tab-container">',
'            <div class="tab active" data-tab="draw">Draw</div>',
'            <div class="tab" data-tab="upload">Upload</div>',
'            <div class="tab" data-tab="camera">Camera</div>',
'          </div>',
'          ',
'          <div id="draw-tab" class="tab-content active">',
'            <canvas id="signature-pad" width="300" height="150"></canvas>',
'            <div class="btn-group">',
'              <button type="button" id="clear-signature" class="btn btn-outline btn-sm"><i class="fas fa-eraser"></i> Clear</button>',
'              <button type="button" id="prev-btn" class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> Preview</button>',
'            </div>',
'          </div>',
'          ',
'          <div id="upload-tab" class="tab-content">',
'            <input type="file" id="upload-signature" class="form-control" accept="image/*" />',
'            <div class="btn-group">',
'              <button type="button" id="upload-preview" class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> Preview</button>',
'            </div>',
'          </div>',
'          ',
'          <div id="camera-tab" class="tab-content">',
'            <video id="camera" ></video>',
'            <div class="btn-group">',
'              <button type="button" id="start-camera" class="btn btn-primary btn-sm"><i class="fas fa-camera"></i> Start Camera</button>',
'              <button type="button" id="capture-signature" class="btn btn-outline btn-sm" disabled><i class="fas fa-camera-retro"></i> Capture</button>',
'            </div>',
'            <canvas id="camera-canvas" width="300" height="150" hidden></canvas>',
'          </div>',
'        </div>',
'',
'          ',
'',
'        ',
'        ',
'        <div class="section">',
'          <h3 class="section-title">',
'            <span><i class="fas fa-palette"></i> Signature Preview</span>',
'          </h3>',
'          <img id="signature-preview" class="signature-preview" />',
'          <div class="btn-group">',
'            <button type="button" id="save-sign" class="btn btn-outline btn-sm"><i class="fas fa-bookmark"></i> Save Sign</button>',
'            <button type="button" id="use-sign" class="btn btn-primary btn-sm" disabled><i class="fas fa-file-import"></i> Use This Sign</button>',
'          </div>',
'        </div>',
'',
'        <div class="section" id="edit-section">',
'          <div class="edit-toggle">',
'            <span class="edit-toggle-label">Edit Options</span>',
'            <label class="toggle-switch">',
'              <input type="checkbox" id="toggle-edit">',
'              <span class="slider"></span>',
'            </label>',
'          </div>',
'          ',
'          <div id="settings-panel" class="settings-panel">',
'            <div class="form-group">',
'              <label>Signature Thickness</label>',
'              <div class="range-slider">',
'                <input type="range" id="signature-thickness" min="1" max="10" value="2">',
'                <span id="thickness-value" class="range-value">2px</span>',
'              </div>',
'            </div>',
'            ',
'            <div class="form-group">',
'              <label>Signature Color</label>',
'              <div class="color-picker">',
'                <input type="color" id="signature-color" value="#000000">',
'                <span id="signature-color-value" class="color-value">#000000</span>',
'              </div>',
'            </div>',
'            ',
'            <div class="btn-group">',
'              <button type="button" id="apply-style" class="btn btn-primary btn-sm"><i class="fas fa-check"></i> Apply</button>',
'              <button type="button" id="clear-style" class="btn btn-danger btn-sm"><i class="fas fa-broom"></i> Reset</button>',
'            </div>',
'          </div>',
'        </div>',
'',
'        <div class="section" id="pdf-preview-toggle">',
'          <div class="edit-toggle">',
'            <span><i class="fas fa-file-pdf"></i> PDF Preview</span>',
'              <label class="toggle-switch">',
'                <input type="checkbox" id="toggle-preview">',
'                <span class="slider"></span>',
'              </label>',
'          </div>',
'        </div>',
'        ',
'      </div>',
'      ',
'      <div class="pdf-viewer">',
'        <div class="section" id="pdf-view">',
'          <h3 class="section-title">',
'            <span><i class="fas fa-file-pdf"></i> PDF Preview</span>',
'          </h3>',
'          ',
'          <div class="pdf-upload-container" id="upload-pdf-container">',
'            <input type="file" id="upload-pdf" class="form-control" accept="application/pdf" />',
'          </div>',
'          ',
'          <div id="pdf-container">',
'            <canvas id="pdf-canvas"></canvas>',
'            <div id="draggable-signature-container">',
'              <img id="draggable-signature" />',
'              <div class="resize-handle resize-handle-top-left"></div>',
'              <div class="resize-handle resize-handle-top-right"></div>',
'              <div class="resize-handle resize-handle-bottom-left"></div>',
'              <div class="resize-handle resize-handle-bottom-right"></div>',
'            </div>',
'          </div>',
'        </div>',
'        ',
'        <div class="section" id="output-sec">',
'          <h3 class="section-title">',
'            <i class="fas fa-cog"></i> Output Settings',
'          </h3>',
'          <div class="form-group">',
'            <label>Save Format</label>',
'            <select id="save-format" class="form-control">',
'              <option value="pdf">PDF Document</option>',
'              <option value="jpeg">JPEG Image</option>',
'              <option value="png">PNG Image</option>',
'              <!-- <option value="docx">Word Document</option> -->',
'            </select>',
'          </div>',
'          ',
'          <div class="pdf-actions">',
'            <button type="button" id="save-pdf" class="btn btn-primary"><i class="fas fa-save"></i> Save PDF</button>',
'            <button type="button" id="download-pdf" class="btn btn-outline"><i class="fas fa-download"></i> Download</button>',
'          </div>',
'        </div>',
'      </div>',
'    </div>',
'  </div>',
'  ',
'  <div id="feedback" class="feedback-message">',
'    <i class="fas fa-check-circle"></i>',
'    <span class="feedback-text">Operation successful</span>',
'  </div>',
'',
'',
'  <div class="set-values" id="set-values" data-edit-toggle="#EDIT_TOGGLE#" data-doc-sign="#DOC_SIGN#"></div>',
'',
'',
'{endif/}'))
,p_default_escape_mode=>'HTML'
,p_translate_this_template=>false
,p_api_version=>1
,p_substitute_attributes=>true
,p_version_scn=>39536079991256
,p_subscribe_plugin_settings=>true
,p_version_identifier=>'1.0'
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(80543016867488019)
,p_plugin_id=>wwv_flow_imp.id(80542704965488011)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>1
,p_display_sequence=>10
,p_static_id=>'DOC_SIGN'
,p_prompt=>'Doc Sign'
,p_attribute_type=>'SELECT LIST'
,p_is_required=>false
,p_default_value=>'0'
,p_escape_mode=>'HTML'
,p_is_translatable=>false
,p_lov_type=>'STATIC'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(80544043227490471)
,p_plugin_attribute_id=>wwv_flow_imp.id(80543016867488019)
,p_display_sequence=>10
,p_display_value=>'Yes'
,p_return_value=>'1'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(80544423188490992)
,p_plugin_attribute_id=>wwv_flow_imp.id(80543016867488019)
,p_display_sequence=>20
,p_display_value=>'No'
,p_return_value=>'0'
);
wwv_flow_imp_shared.create_plugin_attribute(
 p_id=>wwv_flow_imp.id(80543448669488019)
,p_plugin_id=>wwv_flow_imp.id(80542704965488011)
,p_attribute_scope=>'COMPONENT'
,p_attribute_sequence=>2
,p_display_sequence=>20
,p_static_id=>'EDIT_TOGGLE'
,p_prompt=>'Edit Toggle'
,p_attribute_type=>'SELECT LIST'
,p_is_required=>false
,p_default_value=>'0'
,p_escape_mode=>'HTML'
,p_is_translatable=>false
,p_lov_type=>'STATIC'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(80545164820492992)
,p_plugin_attribute_id=>wwv_flow_imp.id(80543448669488019)
,p_display_sequence=>10
,p_display_value=>'Yes'
,p_return_value=>'1'
);
wwv_flow_imp_shared.create_plugin_attr_value(
 p_id=>wwv_flow_imp.id(80545562057493555)
,p_plugin_attribute_id=>wwv_flow_imp.id(80543448669488019)
,p_display_sequence=>20
,p_display_value=>'No'
,p_return_value=>'0'
);
end;
/
prompt --application/end_environment
begin
wwv_flow_imp.import_end(p_auto_install_sup_obj => nvl(wwv_flow_application_install.get_auto_install_sup_obj, false)
);
commit;
end;
/
set verify on feedback on define on
prompt  ...done
