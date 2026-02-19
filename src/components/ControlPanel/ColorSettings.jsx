import React from 'react'

function ColorSettings({ data, onUpdate }) {
    return (
        <div className="accordion-content">
            {/* Background Environment */}
            <div className="appearance-control">
                <label>Arka Plan Ortamı (Yansıma)</label>
                <select
                    value={data.backgroundEnvironment || 'city'}
                    onChange={(e) => onUpdate({ backgroundEnvironment: e.target.value })}
                    className="appearance-select"
                >
                    <option value="photostudio">Fotoğraf Stüdyosu</option>
                    <option value="wooden">Ahşap Stüdyo</option>
                    <option value="apartment">Daire</option>
                    <option value="city">Şehir</option>
                    <option value="sunset">Gün Batımı</option>
                    <option value="studio">Stüdyo</option>
                    <option value="none">Yok</option>
                </select>
            </div>

            {/* Background Color */}
            <div className="appearance-control">
                <label>Arka Plan Rengi</label>
                <div className="color-options">
                    <button
                        className={`color-btn ${(data.backgroundColor || 'default') === 'default' ? 'active' : ''}`}
                        style={{ background: '#1a1a1a' }}
                        onClick={() => onUpdate({ backgroundColor: 'default' })}
                        title="Varsayılan"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'white' ? 'active' : ''}`}
                        style={{ background: '#ffffff', border: '1px solid #ddd' }}
                        onClick={() => onUpdate({ backgroundColor: 'white' })}
                        title="Beyaz"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'lightgray' ? 'active' : ''}`}
                        style={{ background: '#f0f0f0' }}
                        onClick={() => onUpdate({ backgroundColor: 'lightgray' })}
                        title="Açık Gri"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'gray' ? 'active' : ''}`}
                        style={{ background: '#808080' }}
                        onClick={() => onUpdate({ backgroundColor: 'gray' })}
                        title="Gri"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'black' ? 'active' : ''}`}
                        style={{ background: '#000000' }}
                        onClick={() => onUpdate({ backgroundColor: 'black' })}
                        title="Siyah"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'lightblue' ? 'active' : ''}`}
                        style={{ background: '#87ceeb' }}
                        onClick={() => onUpdate({ backgroundColor: 'lightblue' })}
                        title="Açık Mavi"
                    />
                    <button
                        className={`color-btn ${data.backgroundColor === 'cream' ? 'active' : ''}`}
                        style={{ background: '#f5f5dc' }}
                        onClick={() => onUpdate({ backgroundColor: 'cream' })}
                        title="Krem"
                    />
                </div>
                <div className="color-picker-wrapper">
                    <label className="color-picker-label">Özel Renk:</label>
                    <input
                        type="color"
                        value={data.backgroundColor === 'custom' ? (data.customBackgroundColor || '#1a1a1a') : '#1a1a1a'}
                        onChange={(e) => onUpdate({ backgroundColor: 'custom', customBackgroundColor: e.target.value })}
                        className="color-picker"
                    />
                    <span className="color-value">
                        {data.backgroundColor === 'custom' ? (data.customBackgroundColor || '#1a1a1a') :
                            data.backgroundColor === 'white' ? '#ffffff' :
                                data.backgroundColor === 'lightgray' ? '#f0f0f0' :
                                    data.backgroundColor === 'gray' ? '#808080' :
                                        data.backgroundColor === 'black' ? '#000000' :
                                            data.backgroundColor === 'lightblue' ? '#87ceeb' :
                                                data.backgroundColor === 'cream' ? '#f5f5dc' :
                                                    '#1a1a1a'}
                    </span>
                </div>
            </div>
        </div>
    )
}

export default ColorSettings
